export { zodResolver as createFormResolver } from "@hookform/resolvers/zod";

export function getFieldErrorMessage(
  errors: Record<string, { message?: string } | undefined>,
  field: string,
): string | undefined {
  return errors[field]?.message;
}
