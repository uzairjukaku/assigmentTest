import { app } from "./app.js";
app.listen(process.env.PORT || 8000, () => {
  console.log("server running on port number" + process.env.PORT || 8000);
}); 