const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const listingModel = require("./models/listing.js");
const initdata = require("./init/data.js");
const override = require("method-override");
const userdb = require("./models/user.js");
const app = express();
const latestnews = require("./models/latestnews.js");
const latest = require("./models/latest.js");
const axios = require('axios');
const session=require('express-session');
const multer = require('multer');
const fs = require('fs');
const Beauty = require("./models/Beauty.js");
const mysql = require('mysql2/promise');

  
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Save the file with its original name
    }
});

const upload = multer({ storage: storage });


app.use(session({
    secret: 'your_secret_key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware and settings
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // To serve static files like images
app.use(override("_method"));


// Connect to MongoDB
// Database configuration
const dbConfig = {
    host: '13.228.225.19',
    user: 'root',
    password: 'Swap8497#',
    database: 'lifecomeback'
};

// Main function to establish connection
async function main() {
    try {
        // Connect to MySQL database
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL');
        
        await initDB(connection);
        
        // Close connection after initialization
        await connection.end();
    } catch (error) {
        console.error('Error connecting to MySQL', error);
    }
}

// Initialize database with data if empty
async function initDB(connection) {
    try {
        // Check if each table is empty
        const [listingCount] = await connection.execute("SELECT COUNT(*) AS count FROM listing");
        const [latestCount] = await connection.execute("SELECT COUNT(*) AS count FROM latest");
        const [latestNewsCount] = await connection.execute("SELECT COUNT(*) AS count FROM latestnews");
        const [beautyCount] = await connection.execute("SELECT COUNT(*) AS count FROM beauty");

        if (
            listingCount[0].count === 0 && 
            latestCount[0].count === 0 && 
            latestNewsCount[0].count === 0 && 
            beautyCount[0].count === 0
        ) {
            // Insert initial data if tables are empty
            await connection.execute("INSERT INTO listing (/* columns */) VALUES ?", [initdata.data]);
            await connection.execute("INSERT INTO latest (/* columns */) VALUES ?", [initdata.data]);
            await connection.execute("INSERT INTO latestnews (/* columns */) VALUES ?", [initdata.data]);
            await connection.execute("INSERT INTO beauty (/* columns */) VALUES ?", [initdata.data]);

            console.log("Init data inserted");
        } else {
            console.log("Data already exists, skipping initialization");
        }
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Define a route to fetch and display data
app.get('/', async (req, res) => {
    let connection;
    try {
        // Create a new connection for the request
        connection = await mysql.createConnection(dbConfig);
        
        // Retrieve sorted listings from each table
        const [listings] = await connection.execute("SELECT * FROM listing ORDER BY createdAt DESC");
        const [newLatest] = await connection.execute("SELECT * FROM latest ORDER BY createdAt DESC");
        const [newLatestNews] = await connection.execute("SELECT * FROM latestnews ORDER BY createdAt DESC");
        
        // Check if the user is an admin
        const isAdmin = req.session ? req.session.isAdmin || false : false;
        
        // Render the 'index' view with the retrieved data
        res.render('index', { listings, newlatest: newLatest, newlatestnews: newLatestNews, isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    } finally {
        if (connection) await connection.end();
    }
});

// Start the server
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});

// Initialize the database and start the app
main();
app.get('/beauty', async (req, res) => {
    try {
        // Query to fetch data from the 'beauty' table, sorted by createdAt in descending order
        const [beauty] = await db.query('SELECT * FROM beauty ORDER BY createdAt DESC');
        const isAdmin = req.session ? req.session.isAdmin || false : false;
        
        // Render the 'Beauty' view with the fetched data
        res.render('Beauty', { beauty , isAdmin});
    } catch (error) {
        console.error("Error fetching beauty data:", error);
        res.status(500).send("Server error");
    }
});
app.post('/Beauty', upload.single('image'), async (req, res) => {
    try {
        const { title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link, } = req.body;

        // Ensure an image is uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Read the image file
        const img = fs.readFileSync(req.file.path);
        const encodedImage = img.toString('base64');
        const contentType = req.file.mimetype;
        // Insert the new listing into the database
        await db.query('INSERT INTO beauty (title, description, image,imageContentType, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            title,
            description,
            encodedImage,
            contentType,// Store as JSON string
            h || null, // Use null if any optional fields are not provided
            h1 || null,
            h1para || null,
            h2 || null,
            h2para || null,
            h3 || null,
            h3para || null,
            p || null,
            p1 || null,
            p1para || null,
            p2 || null,
            p2para || null,
            p3 || null,
            p3para || null,
            
            link || null
        ]);
        
        res.redirect('/Beauty'); // Redirect after saving
    } catch (error) {
        console.error("Error creating new listing:", error.message);
        res.status(500).send(`Error creating new listing: ${error.message}`);
    }
});
app.post('/Beauty/new', (req, res) => {
    res.render('Beautynewpost');
});
app.delete('/Beauty/:id', async (req, res) => {
    
    try {
        const listingId = req.params.id;
        console.log('Deleting listing with ID:', listingId);

        // Query to check if the listing exists
        const [listing] = await db.query('SELECT * FROM beauty WHERE id = ?', [listingId]);
        if (listing.length === 0) {
            return res.status(404).send('Listing not found');
        }

        // Query to delete the listing
        await db.query('DELETE FROM beauty WHERE id = ?', [listingId]);
        res.redirect('/beauty');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.get('/Beauty/inside/:id', async (req, res) => {
    console.log(`Accessing listing with ID: ${req.params.id}`);
    try {
        const listingId = req.params.id;

        // Query to fetch the listing by ID
        const [listingItem] = await db.execute('SELECT * FROM beauty WHERE id = ?', [listingId]);
        const isAdmin = req.session.isAdmin || false;
        if (listingItem.length === 0) {
            return res.status(404).send('Listing not found');
        }
        
        res.render('Beautyinside.ejs', { beauty: listingItem[0], isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.post('/Beauty/:id/update', async (req, res) => {
    try {
        const listingId = req.params.id;

        // Query to fetch the listing by ID
        const [listings] = await db.query('SELECT * FROM beauty WHERE id = ?', [listingId]);
        if (listings.length === 0) {
            return res.status(404).send('Listing not found');
        }

        res.render('beautyupdate.ejs', { listing: listings[0] }); // Render the update form with listing data
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.put('/Beauty/:id/updated', upload.single('image'), async (req, res) => {
    try {
        const { title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link } = req.body;
        
        let updateQuery = `UPDATE beauty SET title = ?, description = ?, h = ?, h1 = ?, h1para = ?, h2 = ?, h2para = ?, h3 = ?, h3para = ?, p = ?, p1 = ?, p1para = ?, p2 = ?, p2para = ?, p3 = ?, p3para = ?, link = ?`;
        const updateParams = [title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link];

        if (req.file) {
            const img = fs.readFileSync(req.file.path);
            const encodedImage = img.toString('base64');
            updateQuery += `, image = ?, imageContentType = ?`;
            updateParams.push(encodedImage, req.file.mimetype);
        }

        updateQuery += ` WHERE id = ?`;
        updateParams.push(req.params.id);

        const [results] = await db.execute(updateQuery, updateParams);

        if (results.affectedRows === 0) {
            return res.status(404).send('Listing not found');
        }

        res.redirect('/');
    } catch (error) {
        console.error("Error updating listing:", error.message);
        res.status(500).send('Error updating listing');
    }
});
let db;

(async () => {
    db = await mysql.createConnection(dbConfig); // Create connection and assign to db
})();

// POST route to render the new listing form
app.post('/listings/new', (req, res) => {
    res.render('new.ejs');
});

// POST route to update a listing
app.post('/listings/:id/updated', async (req, res) => {
    try {
        const listingId = req.params.id;

        // Query to fetch the listing by ID
        const [listings] = await db.query('SELECT * FROM listing WHERE id = ?', [listingId]);
        if (listings.length === 0) {
            return res.status(404).send('Listing not found');
        }

        res.render('update.ejs', { listing: listings[0] }); // Render the update form with listing data
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// DELETE route to remove a listing
app.delete('/listings/:id', async (req, res) => {
    
    try {
        const listingId = req.params.id;
        console.log('Deleting listing with ID:', listingId);

        // Query to check if the listing exists
        const [listing] = await db.query('SELECT * FROM listing WHERE id = ?', [listingId]);
        if (listing.length === 0) {
            return res.status(404).send('Listing not found');
        }

        // Query to delete the listing
        await db.query('DELETE FROM listing WHERE id = ?', [listingId]);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// PUT route to edit a listing
app.put('/listings/:id/edit', upload.single('image'), async (req, res) => {
    try {
        const listingId = req.params.id;
        const {
            title, description, h, h1, h1para, h2, h2para, h3, h3para,
            p, p1, p1para, p2, p2para, p3, p3para, link
        } = req.body;

        // Prepare the updated fields
        let updatedFields = {
            title,
            description,
            h,
            h1,
            h1para,
            h2,
            h2para,
            h3,
            h3para,
            p,
            p1,
            p1para,
            p2,
            p2para,
            p3,
            p3para,
            link,
        };

        // Check if an image has been uploaded
        if (req.file) {
            const img = fs.readFileSync(req.file.path); // Read the uploaded file
            const encodedImage = img.toString('base64'); // Encode the image
            updatedFields.image = encodedImage; // Store the image as base64 in image_data
            updatedFields.imageContentType = req.file.mimetype; // Store the content type
        }

        // Build the query to update the listing
        const fieldsToUpdate = Object.keys(updatedFields)
            .map(field => `${field} = ?`)
            .join(', ');
        const values = [...Object.values(updatedFields), listingId];

        // Query to update the listing
        await db.query(`UPDATE listing SET ${fieldsToUpdate} WHERE id = ?`, values);

        // Redirect to the updated listing page
        res.redirect(`/listings/${listingId}`);
    } catch (error) {
        console.error("Error updating listing:", error.message);
        res.status(500).send('Error updating listing');
    }
});


// GET route for a specific listing
app.get('/listings/:id', async (req, res) => {
    console.log(`Accessing listing with ID: ${req.params.id}`);
    try {
        const listingId = req.params.id;

        // Query to fetch the listing by ID
        const [listingItem] = await db.execute('SELECT * FROM listing WHERE id = ?', [listingId]);
        const isAdmin = req.session.isAdmin || false;
        if (listingItem.length === 0) {
            return res.status(404).send('Listing not found');
        }
        
        res.render('listing', { listing: listingItem[0], isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// POST route for creating new listings with image upload
app.post('/listings', upload.single('image'), async (req, res) => {
    try {
        const { title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link } = req.body;

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const img = fs.readFileSync(req.file.path);
        const encodedImage = img.toString('base64');
        const contentType = req.file.mimetype;

        // Insert into database
        await db.query(
            'INSERT INTO listing (title, description, image, imageContentType, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                title,
                description,
                encodedImage,
                contentType, // Save MIME type separately
                h || null,
                h1 || null,
                h1para || null,
                h2 || null,
                h2para || null,
                h3 || null,
                h3para || null,
                p || null,
                p1 || null,
                p1para || null,
                p2 || null,
                p2para || null,
                p3 || null,
                p3para || null,
                link || null
            ]
        );

        res.redirect('/');
    } catch (error) {
        console.error("Error creating new listing:", error.message);
        res.status(500).send(`Error creating new listing: ${error.message}`);
    }
});




app.post('/latest', (req, res) => {
    res.render('latest');
});
app.post('/latest1', upload.single('image'), async (req, res) => {
    try {
        const { title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link } = req.body;

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const img = fs.readFileSync(req.file.path);
        const encodedImage = img.toString('base64');
        const contentType = req.file.mimetype;

        // Insert data into SQL table without JSON encoding
        await db.execute(
            `INSERT INTO latest (title, description, image, imageContentType, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, encodedImage, contentType, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link]
        );

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new listing');
    }
});




app.get('/latest/slide/:id', async (req, res) => {
   
    try {
        const [results] = await db.execute(`SELECT * FROM latest WHERE id = ?`, [req.params.id]);

        if (results.length === 0) {
            console.log("Fetched item:", latestItem);
            return res.status(404).send('Listing not found');
        }

        const latestItem = results[0];
        const isAdmin = req.session.isAdmin || false;
        res.render('latestedit', { latest: latestItem, isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/sliding/:id/edit', async (req, res) => {
    try {
        const [results] = await db.execute(`SELECT * FROM latest WHERE id = ?`, [req.params.id]);

        if (results.length === 0) {
            return res.status(404).send('Listing not found');
        }

        const latestItem = results[0];
        const isAdmin = req.session.isAdmin || false;
        res.render('latestupdate', { latest: latestItem, isAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.put('/sliding/:id/edit', upload.single('image'), async (req, res) => {
    try {
        const { title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link } = req.body;
        
        let updateQuery = `UPDATE latest SET title = ?, description = ?, h = ?, h1 = ?, h1para = ?, h2 = ?, h2para = ?, h3 = ?, h3para = ?, p = ?, p1 = ?, p1para = ?, p2 = ?, p2para = ?, p3 = ?, p3para = ?, link = ?`;
        const updateParams = [title, description, h, h1, h1para, h2, h2para, h3, h3para, p, p1, p1para, p2, p2para, p3, p3para, link];

        if (req.file) {
            const img = fs.readFileSync(req.file.path);
            const encodedImage = img.toString('base64');
            updateQuery += `, image = ?, imageContentType = ?`;
            updateParams.push(encodedImage, req.file.mimetype);
        }

        updateQuery += ` WHERE id = ?`;
        updateParams.push(req.params.id);

        const [results] = await db.execute(updateQuery, updateParams);

        if (results.affectedRows === 0) {
            return res.status(404).send('Listing not found');
        }

        res.redirect('/');
    } catch (error) {
        console.error("Error updating listing:", error.message);
        res.status(500).send('Error updating listing');
    }
});

app.delete('/sliding/:id/delete', async (req, res) => {
    try {
        const [results] = await db.execute(`DELETE FROM latest WHERE id = ?`, [req.params.id]);

        if (results.affectedRows === 0) {
            return res.status(404).send('Listing not found');
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

app.post('/latestnews', async (req, res) => {
    res.render('latestnews');
});

app.post('/latestnews1', upload.single('image'), async (req, res) => {
    try {
        const { latestparagraph } = req.body;
        const img = fs.readFileSync(req.file.path); // Read the image file
        const encodedImage = img.toString('base64');
        // Execute SQL INSERT query
        await db.execute(
            `INSERT INTO latestnews (latestparagraph, image, imageContentType) VALUES (?, ?, ?)`,
            [latestparagraph, encodedImage, req.file.mimetype]
        );

        // Redirect after successful save
        res.redirect('/');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating new listing');
    } 
});
app.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Deleting with ID:', id);

        // Execute SQL DELETE query
        const [result] = await db.execute('DELETE FROM latestnews WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).send('Item not found');
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



app.get('/world', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Health&from=2024-10-19&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('world', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});



app.get('/entertenment', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Bollywood&from=2024-10-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('entertenment', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});


app.get('/finance', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=Finance&from=2024-10-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('finance', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});

app.get('/sports', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=World health organisation&from=2024-10-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('sports', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});
  
app.get('/jobs', async (req, res) => {
    const apiKey = '776ba8b24e8344fd9c26ffd4560c14f3';
    const url = `https://newsapi.org/v2/everything?q=workout&from=2024-10-18&sortBy=publishedAt&apikey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const article = response.data.articles || [];

        // Log the titles and descriptions
        const articles = article.filter(article => article.urlToImage);
        // Render the data using EJS template
        res.render('jobs', { news: articles });

    } catch (error) {
        console.error('Error Details:', error.response ? error.response.data : error.message);
        res.status(500).send("An error occurred while fetching the news.");
    }
});
//   // Start the server
 
// app.get('/signup',(req, res) => {
//     res.render('signup', { message: null });
// });

// app.post('/signup', async (req, res) => {
//     try {
//         const { username, email,mobile,dob,address, password, } = req.body;
//         const registeredUser = await userdb.findOne({ email });

//         if (registeredUser) {
//             return res.render('signup', { message: 'Email already exists' });
           
//         }
        
//         let user = new userdb({ username, email,mobile,dob,address, password });
//         await user.save();

//         res.render('login', { message: 'Sign up successful!' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).render('signup', { message: 'Error signing up' });
//     }
// });
app.get('/login', (req, res) => {
 
    res.render('login', {message:null}); // Render the admin dashboard or session page
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Assuming user validation logic is correct
        if (email !== 'swapnilkittur@gmail.com' || password !== 'Swap8497#') {
            return res.render('login', { message: 'Invalid credentials' });
        }

        req.session.user = { email: email };
        req.session.isAdmin = (email === 'swapnilkittur@gmail.com'); // Set isAdmin in session

        res.redirect('/'); // Redirect to the listings page
    } catch (err) {
        console.error(err);
        res.render('login', { message: 'An error occurred, please try again later.' });
    }
});

// Logout route to handle session termination
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.render('error', { message: 'Failed to log out. Please try again.' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/'); // Redirect to the login page
    });
});

app.get('/about', (req, res) => {
    res.render('aboutus');
    });

    app.get('/privacy', (req, res) => {
        res.render('privacy');
        });

        app.get('/terms', (req, res) => {
            res.render('terms');
            });

            app.get('/contact', (req, res) => {
                res.render('contact');
                });

             





// Route to render the symptoms form initially (without advice)

               
                
                
              