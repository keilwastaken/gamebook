import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  className,
  type = "default",
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedTextProps) {
  const getTextClasses = () => {
    const baseClasses = "text-sage-700 dark:text-sage-300";
    const typeClasses = {
      default: "text-base leading-6",
      title: "text-2xl font-bold leading-8",
      defaultSemiBold: "text-base leading-6 font-semibold",
      subtitle: "text-xl font-bold",
      link: "text-base leading-8 text-sage-500 dark:text-sage-400 underline",
    };

    return [baseClasses, typeClasses[type], className].filter(Boolean).join(" ");
  };

  return <Text className={getTextClasses()} style={style} {...rest} />;
}
