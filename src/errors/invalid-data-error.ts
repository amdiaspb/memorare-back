import { ApplicationError } from "@/protocols";

export function invalidDataError(details: string[]): ApplicationErrorDetailed {
  return {
    name: "InvalidDataError",
    message: "Invalid data!",
    details,
  };
}

type ApplicationErrorDetailed = ApplicationError & {
  details: string[];
};
