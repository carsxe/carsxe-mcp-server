import { createCarsxeHttpServer } from "./httpHandler.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);

const httpServer = createCarsxeHttpServer();

httpServer.listen(PORT, () => {
  console.log(`CarsXE MCP server listening on port ${PORT}`);
});
