import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

function envLoad(): void {
  let path = ".env";
  
  switch (process.env.NODE_ENV) {
    case "test": path = ".env.test"; break;
    default: break;
  }

  const env = dotenv.config({ path });
  dotenvExpand.expand(env);
}

export { envLoad };
