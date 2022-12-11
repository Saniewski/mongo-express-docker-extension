package main

import (
	"flag"
	"fmt"
	"gopkg.in/yaml.v3"
	"net"
	"net/http"
	"os"

	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

var (
	logger         *logrus.Logger
	configFilename = "./mongo-express-config.yaml"
)

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest/volumes-service.sock", "Unix domain socket to listen on")
	flag.Parse()

	_ = os.RemoveAll(socketPath)

	logger = logrus.New()

	logger.Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true

	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		logger.Fatalf("Failed to listen on %s: %v", socketPath, err)
	}
	router.Listener = ln

	router.GET("/config", getConfig)
	router.POST("/config", saveConfig)
	router.DELETE("/config", resetConfig)

	logger.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func getConfig(ctx echo.Context) error {
	f, err := os.ReadFile(configFilename)
	if err != nil {
		logger.Errorf("Failed to read config file: %v", err)
		return ctx.JSON(http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to read config file",
		})
	}

	var mongoDbConfig MongoDbConfig

	err = yaml.Unmarshal(f, &mongoDbConfig)
	if err != nil {
		logger.Errorf("Failed to unmarshal config file: %v", err)
		return ctx.JSON(http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to unmarshal config file",
		})
	}

	return ctx.JSON(http.StatusOK, Payload{
		Error:   false,
		Message: "Success",
		Data:    mongoDbConfig,
	})
}

func saveConfig(ctx echo.Context) error {
	var mongoDbConfig MongoDbConfig
	err := ctx.Bind(&mongoDbConfig)
	if err != nil {
		logger.Errorf("Failed to bind request body: %v", err)
		return ctx.JSON(http.StatusBadRequest, Payload{
			Error:   true,
			Message: "Failed to bind request body",
		})
	}

	statusCode, payload := writeToConfigFile(mongoDbConfig)
	return ctx.JSON(statusCode, payload)
}

func resetConfig(ctx echo.Context) error {
	mongoDbConfig := MongoDbConfig{
		Hostname:            "localhost",
		Port:                27017,
		ConnectionString:    "mongodb://localhost:27017",
		RememberCredentials: false,
	}

	statusCode, payload := writeToConfigFile(mongoDbConfig)
	return ctx.JSON(statusCode, payload)
}

func writeToConfigFile(config MongoDbConfig) (int, Payload) {
	configBytes, err := yaml.Marshal(config)
	if err != nil {
		logger.Errorf("Failed to marshal config: %v", err)
		return http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to marshal config",
		}
	}

	err = os.WriteFile(fmt.Sprintf("%s.tmp", configFilename), configBytes, 0644)
	if err != nil {
		logger.Errorf("Failed to write to config file: %v", err)
		return http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to write to config file",
		}
	}

	err = os.Rename(fmt.Sprintf("%s.tmp", configFilename), configFilename)
	if err != nil {
		logger.Errorf("Failed to save config file: %v", err)
		return http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to save config file",
		}
	}

	return http.StatusOK, Payload{
		Error:   false,
		Message: "Success",
		Data:    config,
	}
}

type Payload struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

type MongoDbConfig struct {
	Hostname            string `mapstructure:"hostname" yaml:"hostname" json:"hostname"`
	Port                int    `mapstructure:"port" yaml:"port" json:"port"`
	Username            string `mapstructure:"username" yaml:"username,omitempty" json:"username,omitempty"`
	Password            string `mapstructure:"password" yaml:"password,omitempty" json:"password,omitempty"`
	ConnectionString    string `mapstructure:"connectionString" yaml:"connectionString" json:"connectionString"`
	RememberCredentials bool   `mapstructure:"rememberCredentials" yaml:"rememberCredentials" json:"rememberCredentials"`
}
