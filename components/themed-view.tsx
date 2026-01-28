import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
};

export function ThemedView({
  className,
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedViewProps) {
  const getViewClasses = () => {
    const baseClasses = "bg-cream dark:bg-cream-dark";
    return [baseClasses, className].filter(Boolean).join(" ");
  };

  return <View className={getViewClasses()} style={style} {...rest} />;
}