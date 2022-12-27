const app=express()

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const {Todo}=require("./models")

app.get("/todos",async (request,response)=>{
    //response.send("Hello World!!")
    console.log("todolist")
    try{
        const todolis = await Todo.findAll({order: [["id","ASC"]]});
        return response.json(todolis)
        }
    catch(error){
        console.log(error);
        return response.status(422).json(error);
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
})


app.post("/todos", async (request,response) =>{
    console.log("Creating a todo", request.body)
    try {
        const todo= await Todo.addTodo({ title: request.body.title, dueDate: request.body.dueDate, completed:false})
        return response.json(todo)
    } catch (error) {
        console.log("error")
        return response.status(422).json(error)
    }
    
})

app.put("/todos/:id/MarkAsCompleted",async(request,response)=>{
    console.log("we have to update a todo with id", request.params.id)
    const todo=await Todo.findByPk(request.params.id)
    
    try {
        const updatedtodo=await todo.markAsCompleted()
        return response.json(updatedtodo)
    } catch (error) {
        console.log("error")
        return response.status(422).json(error)
    }

})

app.delete("/todos/:id",async (request,esponse)=>{
    console.log("delete todo by id:", request.params.id)
    try{
        const delet=await Todo.destroy({where: {id: request.params.id} });
          response.send(delet ? true : false);
    
        }
        catch(error){
        console.log(error);
        return response.status(422).json(error);
        }
})

module.exports = app;