import React from "react";
import { App } from "./App";
import { HomePage } from "./pages/Home";
import { MongoExpressPage } from "./pages/MongoExpress";

jest.mock("./pages/Home", () => ({ HomePage: () => null }));
jest.mock("./pages/MongoExpress", () => ({ MongoExpressPage: () => null }));

test("routes the home, Mongo Express, and unknown paths to their pages", () => {
  const app = App();
  const routes = React.Children.toArray(
    (app.props.children as React.ReactElement).props.children,
  ) as React.ReactElement[];

  expect(routes).toHaveLength(3);
  expect(routes.map((route) => route.props.path)).toEqual([
    "/",
    "/mongo-express/:connectionId",
    "*",
  ]);
  expect(routes[0].props.element.type).toBe(HomePage);
  expect(routes[1].props.element.type).toBe(MongoExpressPage);
  expect(routes[2].props.element.type).toBe(HomePage);
});
