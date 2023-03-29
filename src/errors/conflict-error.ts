import { ApplicationError } from "@/protocols";

export function conflictError(item: string = ""): ApplicationErrorSpecific {
  return {
    name: "ConflictError",
    message: "Conflicting data!",
    item
  };
}

type ApplicationErrorSpecific = ApplicationError & {
  item: string;
};
