const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
let database = null;

app.use(express.json());

initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializationDbAndServer();

// GET TODO LIST API

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

// GET TODO Item API

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodosItem = `
    SELECT
        *
    FROM
        todo
    WHERE
        id=${todoId}`;

  const dbResponse = await database.get(getTodosItem);
  response.send(dbResponse);
});

// POST TODO ITEM API

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodosItem = `
    INSERT INTO
        todo (id, todo, priority, status)
    VALUES 
    (${id},'${todo}', '${priority}', '${status}');`;

  await database.run(addTodosItem);
  response.send("Todo Successfully Added");
});

// PUT TODO ITEM API

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};`;

  const previousTodoItem = await database.get(previousTodoQuery);

  const {
    todo = previousTodoItem.todo,
    status = previousTodoItem.status,
    priority = previousTodoItem.priority,
  } = request.body;

  const putTodoItem = `
    UPDATE
        todo
    SET
        todo = '${todo}',
        status ='${status}',
        priority = '${priority}'
    WHERE
        id = ${todoId};`;

  await database.run(putTodoItem);
  response.send(`${updateColumn} Updated`);
});

// DELETE TODO Item API

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodosItem = `
    DELETE
    FROM
        todo
    WHERE
        id=${todoId}`;

  await database.run(deleteTodosItem);
  response.send("Todo Deleted");
});

module.exports = app;
