import { cn } from "@/lib/utils";
import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  className?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  className,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const getTextClasses = () => {
    const baseClasses = "text-gray-900";
    const typeClasses = {
      default: "text-base leading-6",
      title: "text-2xl font-bold leading-8",
      defaultSemiBold: "text-base leading-6 font-semibold",
      subtitle: "text-xl font-bold",
      link: "text-base leading-8 text-sage-500 dark:text-sage-300 underline",
    };

    return cn(baseClasses, typeClasses[type], className);
  };

  return <Text className={getTextClasses()} {...rest} />;
}
