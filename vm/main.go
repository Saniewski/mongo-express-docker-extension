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
	configFilename = "./extension-config.yaml"
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

	var extensionConfig ExtensionConfig

	err = yaml.Unmarshal(f, &extensionConfig)
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
		Data:    extensionConfig,
	})
}

func saveConfig(ctx echo.Context) error {
	var extensionConfig ExtensionConfig
	err := ctx.Bind(&extensionConfig)
	if err != nil {
		logger.Errorf("Failed to bind request body: %v", err)
		return ctx.JSON(http.StatusBadRequest, Payload{
			Error:   true,
			Message: "Failed to bind request body",
		})
	}

	configBytes, err := yaml.Marshal(extensionConfig)
	if err != nil {
		logger.Errorf("Failed to marshal config: %v", err)
		return ctx.JSON(http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to marshal config",
		})
	}

	err = os.WriteFile(fmt.Sprintf("%s.tmp", configFilename), configBytes, 0644)
	if err != nil {
		logger.Errorf("Failed to write to config file: %v", err)
		return ctx.JSON(http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to write to config file",
		})
	}

	err = os.Rename(fmt.Sprintf("%s.tmp", configFilename), configFilename)
	if err != nil {
		logger.Errorf("Failed to save config file: %v", err)
		return ctx.JSON(http.StatusInternalServerError, Payload{
			Error:   true,
			Message: "Failed to save config file",
		})
	}

	return ctx.JSON(http.StatusOK, Payload{
		Error:   false,
		Message: "Success",
		Data:    extensionConfig,
	})
}

type Payload struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

type ExtensionConfig struct {
	Hostname            string `mapstructure:"hostname" yaml:"hostname" json:"hostname"`
	Port                int    `mapstructure:"port" yaml:"port" json:"port"`
	Username            string `mapstructure:"username" yaml:"username" json:"username"`
	Password            string `mapstructure:"password" yaml:"password" json:"password"`
	ConnectionString    string `mapstructure:"connectionString" yaml:"connectionString" json:"connectionString"`
	RememberCredentials bool   `mapstructure:"rememberCredentials" yaml:"rememberCredentials" json:"rememberCredentials"`
	AuthMethod          string `mapstructure:"authMethod" yaml:"authMethod" json:"authMethod"`
}
