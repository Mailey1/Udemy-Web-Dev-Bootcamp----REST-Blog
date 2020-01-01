var express         = require("express"),
bodyParser          = require("body-parser"),
methodOverride      = require("method-override"),
mongoose            = require("mongoose"),
expressSanitizer    = require("express-sanitizer");

app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

mongoose.set("useUnifiedTopology", true);
mongoose.set("useNewUrlParser", true);
mongoose.connect(process.env.DATABASEURL2);

// SETTING UP DB SCHEMA AND MONGOOSE MODEL
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});

var Blog = mongoose.model("Blog", blogSchema);

// RESTFUL ROUTES

// HOME ROUTE
app.get("/", function(req, res){
    res.redirect("/blogs");
});

// INDEX ROUTE - ask db for every blog and display them
app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err) console.log(err);
        else res.render("index.ejs", {blogs: blogs});
    });
});

// NEW ROUTE - display a form to make a new blog
// Upon clicking the create button at /blogs/new, send a post request to /blogs, with the info of the blog stored in the request's body.
app.get("/blogs/new", function(req, res){
    res.render("new.ejs");
});

// CREATE ROUTE - the data for the blog is stored inside the requests body, since sent from a form using a post request.
app.post("/blogs", function(req, res){
    // First sanitize the body of blog.
    req.body.blog.body = req.sanitize(req.body.blog.body);
    // Create blog; redirect to index.
    Blog.create(req.body.blog, function(err, newBlog){
        if(err) res.render("new.ejs");
        else res.redirect("/blogs");
    });
});

// SHOW ROUTE - the show button on /blogs was created from the object in the db, so it knows what it's id is. Clicking the button sends a get request to /blogs/:id
// Find the object in the db by using the id supplied in the url and display it.
app.get("/blogs/:id", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err) res.redirect("/");
        else{
            res.render("show.ejs", {blog: foundBlog});
        }
    });
});

// EDIT ROUTE - edits an entry in the db, then will call update to actually update the entry.
// This location is arrived to from the /blogs/:id, so the id already resides in the url. Use it to find the blog to be edited, and pass it to the ejs file so the current
// info can be displayed and edited.
app.get("/blogs/:id/edit", function(req, res){
    // Find blog, send it to edit page. Edit page will send a put request to /blogs/:id to update the content in the db.
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err) res.redirect("/blogs/" + req.params.id);
        else{
            res.render("edit.ejs", {blog: foundBlog});
        }
    });
});

// UPDATE ROUTE - takes the info from /blogs/:id/edit and updates the entry in the db.
// The id still resides in the url, so the entry in the db is found using the request parameter. Since the data for the edited post is sent as a PUT request
// and methodOverrider forces it to a PUT request, the data for the edited blog arrives in the body of the request. Use the id to find the entry, and write the data to the db.
app.put("/blogs/:id", function(req, res){
    // First sanitize the body of blog.
    req.body.blog.body = req.sanitize(req.body.blog.body);
    // Function is self explanatory - first param is id of entry in db, second param is what we wish to write to the db.
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
        if(err) res.redirect("/");
        else{
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

// DELETE ROUTE - deletes a blog
// The id resides in the url, this request is made from /blogs/:id. Just find the entry in the db and remove it.
app.delete("/blogs/:id", function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err){
        if(err) res.redirect("/blogs");
        else{
            res.redirect("blogs");
        }
    })
});

app.listen(3000, function(){
    console.log("Server running on Port 3000");
});

