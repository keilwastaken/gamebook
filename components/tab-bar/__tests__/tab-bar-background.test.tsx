import React from "react";
import { Image, StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";

import { IMAGE_ASPECT_RATIO } from "../constants";
import { TabBarBackground } from "../tab-bar-background";

describe("TabBarBackground", () => {
  it("sizes background image from width and fixed aspect ratio", () => {
    const width = 360;
    const view = render(<TabBarBackground width={width} />);
    const image = view.UNSAFE_getByType(Image);
    const style = StyleSheet.flatten(image.props.style);

    expect(style.width).toBe(width);
    expect(style.height).toBe(width * IMAGE_ASPECT_RATIO);
    expect(style.marginTop).toBe(-70);
  });
});
