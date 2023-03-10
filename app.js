const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const { Todo,User} = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
const cookieParser = require("cookie-parser");
const passport = require("passport");
const connectensurelogin=require("connect-ensure-login");
const session=require("express-session");
const flash = require("connect-flash");
const LocalStrategy=require("passport-local");
const bcrypt=require('bcrypt');
const saltRounds=10;

app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(flash())
const { title } = require("process");


app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret:"my-super-secret-key-123345657898",
  cookie: {
    maxAge: 24*60*60*1000 //24hrs

  }
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
},  (username,password,done) =>{
  User.findOne({where: {email: username}})
  .then(async (user)=> {
    const result = await bcrypt.compare(password,user.password)
    if(result) {
      return done(null,user);
    } else {
      return done(null,false,{message:"Invalid Password"});
    }
    
  }).catch((error) => {
    return done(null,false,{message:"please check email id"})
  })
}))


passport.serializeUser((user, done) =>{
  console.log("serializing user in session", user.id)
  done(null,user.id)
});

passport.deserializeUser((id , done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error =>{
      done(error,null)
    })

});


app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});


app.get("/", async function (request, response) {
    response.render("index", {
      title: "Todo application",
      csrfToken: request.csrfToken(),
  }); 
});

app.get("/todos",connectensurelogin.ensureLoggedIn(), async function (request, response) {
  const loggedInUser= request.user.id;
  const alltodo = await Todo.getTodos();
  const overdue = await Todo.overdue(loggedInUser);
  const dueToday = await Todo.dueToday(loggedInUser);
  const dueLater = await Todo.dueLater(loggedInUser);
  const completed = await Todo.completed(loggedInUser);
  if (request.accepts("html")) {
    response.render("todos", {
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
    if(request.body.firstname.length<1 )
    {
      request.flash("error", "please enter First Name");
       return response.redirect('/signup');
    }
    if(request.body.lastname.length<1 )
    {
      request.flash("error", "please enter Last Name");
       return response.redirect('/signup');
    }
    if(request.body.email.length<1)
    {
      request.flash('error', 'please enter Email Id');
      return response.redirect('/signup');
    }
    if(request.body.password.length<8)
    {
      request.flash("error", "please enter password consist of minimum 8 characters");
       return response.redirect('/signup');
    
    }
    //hash using bcrypt
    const hashedPwd = await bcrypt.hash(request.body.password,saltRounds)
    console.log(hashedPwd)

    //users creation here
    const user= await User.create({
      firstname: request.body.firstname,
      lastname: request.body.lastname,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user , (err) =>{
      if(err) {
        console.log(err)
      }
      response.redirect("/todos");
    })
      
  } 
  catch (error) {
      console.log(error);
      request.flash("error", "Already registered Email Id!!!!");
      return response.redirect('/signup');
  }

})

app.get("/login", async(request, response) => {
  response.render("login", {title:"login", csrfToken:request.csrfToken()});
})

app.post("/session", passport.authenticate('local',{failureRedirect:"/login",failureFlash: true,}), (request,response)=>{
  response.redirect("/todos");
})

app.get("/signout",(request,response) => {
  //signing out
  request.logout((err) => {
    if (err) { return next(err); }
    response.redirect("/");
  })
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

app.post("/todos",connectensurelogin.ensureLoggedIn(), async (request, response) => {
  if(request.body.title== null || request.body.title.length<5)
    {
      request.flash('error', 'please enter a todo title with minimum 5 characters');
      return response.redirect('/todos');
    }
  if(!request.body.dueDate){
      request.flash('error', 'please select date');
      return response.redirect('/todos');
  }
  try {
    await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      userId: request.user.id
    });
    return response.redirect("/todos");
  } catch (error) {
    console.log(error);
    request.flash("error", error.message);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id",connectensurelogin.ensureLoggedIn(), async (request, response) => {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", connectensurelogin.ensureLoggedIn(),async (request, response) => {
  try {
    await Todo.remove(request.params.id,request.user.id);
    return response.json(true);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;