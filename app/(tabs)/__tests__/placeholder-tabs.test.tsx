import React from "react";
import { render, screen } from "@testing-library/react-native";

import FavoritesScreen from "../favorites";
import LibraryScreen from "../library";
import ProfileScreen from "../profile";

describe("placeholder tabs", () => {
  it("renders favorites screen shell", () => {
    render(<FavoritesScreen />);
    expect(screen.getByTestId("screen-favorites")).toBeTruthy();
    expect(screen.getByText("Favorites")).toBeTruthy();
  });

  it("renders library screen shell", () => {
    render(<LibraryScreen />);
    expect(screen.getByTestId("screen-library")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();
  });

  it("renders profile screen shell", () => {
    render(<ProfileScreen />);
    expect(screen.getByTestId("screen-profile")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
  });
});
