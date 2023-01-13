const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo,User} = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
var cookieParser = require("cookie-parser");

app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
const path = require("path");
const { title } = require("process");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  const alltodo = await Todo.getTodos();
  const overdue = await Todo.overdue();
  const dueToday = await Todo.dueToday();
  const dueLater = await Todo.dueLater();
  const completed = await Todo.completed();
  if (request.accepts("html")) {
    response.render("index", {
      title: "Todo application",
      overdue,
      dueToday,
      dueLater,
      completed,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      completed,
    });
  }
});

app.get("/signup", (request , response) => {
   response.render("signup",{title:"signup", csrfToken:request.csrfToken()} )
})

app.post("/users",async (request,response) => {
  try{
    const user= await User.create({
      firstname: request.body.firstname,
      lastname: request.body.lastname,
      email: request.body.email,
      password: request.body.password,
    })
    response.redirect("/");
  } catch(error){
    console.log("error");
  }
})
app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async (request, response) => {
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
  try {
    await Todo.remove(request.params.id);
    return response.json(true);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;