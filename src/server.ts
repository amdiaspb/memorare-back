import { dbConnect, envLoad } from "@/configs";
import { app } from "@/app";

envLoad();
dbConnect();

const port = +process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running at port ${port}...`);
});
