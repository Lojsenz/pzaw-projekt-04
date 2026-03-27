import express from "express";
import "dotenv/config";
import bcrypt from "bcrypt";
import {add, login, getNotes, addNote, getNoteById, deleteNote} from './db/db.js';
import session from "express-session";

const app = express();
const PORT = process.env.PORT;
app.use(express.static('public'));
app.set('view engine','pug')
app.use(express.urlencoded({extended: false}))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


app.listen(PORT, ()=> {
    console.log(`http://localhost:${PORT}`);
});

app.get("/",(req, res)=> {
    res.render('index')
});

app.get("/login",(req,res)=> {
    res.render('login')
});

app.get("/register",(req,res)=>{
    res.render('register')
});

app.post("/login",async (req,res)=>{
    const {user, pass} = req.body;
    let IsAdmin = false;

        const row = login(user);
    if (!row) return res.render("login", { error: 'Wrong username or password' });

    const match = await bcrypt.compare(pass,row.password);
    if (!match) return res.render("login", { error: 'Wrong username or password' });

    if (user === process.env.ADMIN_LOGIN) {
    IsAdmin= true;
    }
    req.session.isadmin = IsAdmin;

    req.session.user = user;
    req.session.userId = row.id;
    res.redirect('/main_page');
});

app.post("/register",async (req,res)=>{
    const {user,pass} = req.body;
    const hash = await bcrypt.hash(pass,10);
    if(login(user)){
        return res.render("register", {error: 'User already exists'});
    }
    add(user,hash);
    res.redirect('/login');
    

});

app.get("/main_page",(req,res)=>{
    
    res.render("main_page",{user: req.session.user, isadmin: req.session.isadmin});
});

app.get("/main_page/notes",(req,res)=>{
    const notes = getNotes(req.session.userId, req.session.isadmin)
    res.render("notes",{notes})
});

app.get("/main_page/notes/:id",(req,res)=>{
    const note = getNoteById(req.params.id);
    res.render("note", {note});
});

app.get("/main_page/add_note",(req,res)=>{
    res.render("add_note");
})

app.post("/add_note",(req,res)=>{
    const {Title,Note} = req.body;
    addNote(Title,Note,req.session.userId);
    res.redirect("/main_page/notes");
});

app.get("/main_page/note",(req,res)=>{
    res.render("note");
});

app.get("/logout",(req,res)=>{
    req.session.destroy;
    res.redirect("/login");
});

app.get("/main_page/notes/:id/delete",(req,res)=>{
    deleteNote(req.params.id);
    res.redirect("/main_page/notes");

});