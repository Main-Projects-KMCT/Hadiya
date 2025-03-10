var express = require("express");
var userHelper = require("../helper/userHelper");
var teacherHelper = require("../helper/teacherHelper");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const path = require("path");

var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedIn) {
    next();
  } else {
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  userHelper.getAllproducts().then((products) => {
    res.render("users/home", { admin: false, products, user });
  });
});


router.get("/dashboard", verifySignedIn, async function (req, res, next) {
  let user = req.session.user;
  userHelper.getAllproducts().then((products) => {
    res.render("users/dashboard/home", { admin: false, products, user });
  });
});



router.get("/leave", verifySignedIn, async function (req, res, next) {
  let user = req.session.user;
  if (!user || !user._id) {
    return res.status(403).send("Unauthorized");
  }
  const leaves = await userHelper.getleavesById(user._id);  // ✅ Pass user ID
  res.render("users/leave", { admin: false, leaves, user });

});

router.post("/add-leave", function (req, res) {
  userHelper.addLeave(req.body, (id) => {
    res.redirect("/leave");

  });
});


///////ALL attendances/////////////////////                                         
router.get("/attendance", verifySignedIn, async function (req, res) {
  try {
    let user = req.session.user;
    if (!user || !user._id) {
      return res.status(403).send("Unauthorized");
    }

    const attendanceData = await userHelper.getAllattendancebyid(user._id);  // ✅ Pass user ID

    console.log("Attendance Data:", JSON.stringify(attendanceData, null, 2)); // Debugging

    res.render("users/dashboard/attendance", {
      admin: false,
      layout: 'layout',
      attendance: attendanceData,
      user
    });

  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).send("Internal Server Error");
  }
});




router.get("/notifications", verifySignedIn, async function (req, res) {
  let user = req.session.user;  // Get logged-in user from session

  let notifications = await userHelper.getnotificationById(user._id)
  let products = await userHelper.getAllProducts()

  res.render("users/notifications", { admin: false, notifications, user, products });
});

router.get("/about", async function (req, res) {
  res.render("users/about", { admin: false, });
})


router.get("/contact", async function (req, res) {
  res.render("users/contact", { admin: false, });
})

router.get("/service", async function (req, res) {
  res.render("users/service", { admin: false, });
})


router.post("/add-feedback", async function (req, res) {
  let user = req.session.user; // Ensure the user is logged in and the session is set
  let feedbackText = req.body.text; // Get feedback text from form input
  let username = req.body.username; // Get username from form input
  let productId = req.body.productId; // Get product ID from form input
  let teacherId = req.body.teacherId; // Get teacher ID from form input

  if (!user) {
    return res.status(403).send("User not logged in");
  }

  try {
    const feedback = {
      userId: ObjectId(user._id), // Convert user ID to ObjectId
      productId: ObjectId(productId), // Convert product ID to ObjectId
      teacherId: ObjectId(teacherId), // Convert teacher ID to ObjectId
      text: feedbackText,
      username: username,
      createdAt: new Date() // Store the timestamp
    };

    await userHelper.addFeedback(feedback);
    res.redirect("/single-product/" + productId); // Redirect back to the product page
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).send("Server Error");
  }
});



router.get("/single-product/:id", async function (req, res) {
  let user = req.session.user;
  const productId = req.params.id;

  try {
    const product = await userHelper.getProductById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    const feedbacks = await userHelper.getFeedbackByProductId(productId); // Fetch feedbacks for the specific product

    res.render("users/single-product", {
      admin: false,
      user,
      product,
      feedbacks
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Server Error");
  }
});




////////////////////PROFILE////////////////////////////////////
router.get("/profile", async function (req, res, next) {
  let user = req.session.user;
  res.render("users/profile", { admin: false, user });
});

////////////////////USER TYPE////////////////////////////////////
router.get("/usertype", async function (req, res, next) {
  res.render("users/usertype", { admin: false, layout: 'empty' });
});





router.get("/signup", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signup", { admin: false, layout: 'empty' });
  }
});

router.post("/signup", async function (req, res) {
  const { Fname, Email, Phone, Address, Pincode, District, Password } = req.body;
  let errors = {};

  // Check if email already exists
  const existingEmail = await db.get()
    .collection(collections.USERS_COLLECTION)
    .findOne({ Email });

  if (existingEmail) {
    errors.email = "This email is already registered.";
  }

  // Validate phone number length and uniqueness

  if (!Phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!/^\d{10}$/.test(Phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  } else {
    const existingPhone = await db.get()
      .collection(collections.USERS_COLLECTION)
      .findOne({ Phone });

    if (existingPhone) {
      errors.phone = "This phone number is already registered.";
    }
  }
  // Validate Pincode
  if (!Pincode) {
    errors.pincode = "Please enter your pincode.";
  } else if (!/^\d{6}$/.test(Pincode)) {
    errors.pincode = "Pincode must be exactly 6 digits.";
  }

  if (!Fname) errors.fname = "Please enter your first name.";
  if (!Email) errors.email = "Please enter your email.";
  if (!Address) errors.address = "Please enter your address.";
  if (!District) errors.district = "Please enter your city.";

  // Password validation
  if (!Password) {
    errors.password = "Please enter a password.";
  } else {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    if (!strongPasswordRegex.test(Password)) {
      errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.render("users/signup", {
      admin: false,
      layout: 'empty',
      errors,
      Fname,
      Email,
      Phone,
      Address,
      Pincode,
      District,
      Password
    });
  }

  // Proceed with signup
  userHelper.doSignup(req.body).then((response) => {
    req.session.signedIn = true;
    req.session.user = response;
    res.redirect("/");
  }).catch((err) => {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred during signup.");
  });
});


router.get("/signin", function (req, res) {
  if (req.session.signedIn) {
    res.redirect("/");
  } else {
    res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});


router.post("/signin", function (req, res) {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    req.session.signInErr = "Please fill in all fields.";
    return res.render("users/signin", {
      admin: false,
      layout: 'empty',
      signInErr: req.session.signInErr,
      email: Email,
      password: Password,
    });
  }

  userHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      // If the user is disabled, display the message
      req.session.signInErr = response.msg || "Invalid Email/Password";
      res.render("users/signin", {
        admin: false,
        layout: 'empty',
        signInErr: req.session.signInErr,
        email: Email
      });
    }
  });
});




router.get("/signout", function (req, res) {
  req.session.signedIn = false;
  req.session.user = null;
  res.redirect("/");
});

router.get("/edit-profile/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  let userProfile = await userHelper.getUserDetails(userId);
  res.render("users/edit-profile", { admin: false, userProfile, user });
});

router.post("/edit-profile/:id", verifySignedIn, async function (req, res) {
  try {
    const { Fname, Lname, Email, Phone, Address, District, Pincode } = req.body;
    let errors = {};

    // Validate first name
    if (!Fname || Fname.trim().length === 0) {
      errors.fname = 'Please enter your first name.';
    }

    if (!District || District.trim().length === 0) {
      errors.district = 'Please enter your first name.';
    }

    // Validate last name
    if (!Lname || Lname.trim().length === 0) {
      errors.lname = 'Please enter your last name.';
    }

    // Validate email format
    if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // Validate phone number
    if (!Phone) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^\d{10}$/.test(Phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }


    // Validate pincode
    if (!Pincode) {
      errors.pincode = "Please enter your pincode.";
    } else if (!/^\d{6}$/.test(Pincode)) {
      errors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!Fname) errors.fname = "Please enter your first name.";
    if (!Lname) errors.lname = "Please enter your last name.";
    if (!Email) errors.email = "Please enter your email.";
    if (!Address) errors.address = "Please enter your address.";
    if (!District) errors.district = "Please enter your district.";

    // Validate other fields as needed...

    // If there are validation errors, re-render the form with error messages
    if (Object.keys(errors).length > 0) {
      let userProfile = await userHelper.getUserDetails(req.params.id);
      return res.render("users/edit-profile", {
        admin: false,
        userProfile,
        user: req.session.user,
        errors,
        Fname,
        Lname,
        Email,
        Phone,
        Address,
        District,
        Pincode,
      });
    }

    // Update the user profile
    await userHelper.updateUserProfile(req.params.id, req.body);

    // Fetch the updated user profile and update the session
    let updatedUserProfile = await userHelper.getUserDetails(req.params.id);
    req.session.user = updatedUserProfile;

    // Redirect to the profile page
    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).send("An error occurred while updating the profile.");
  }
});





router.get('/place-order/:id', verifySignedIn, async (req, res) => {
  const productId = req.params.id;

  // Validate the product ID
  if (!ObjectId.isValid(productId)) {
    return res.status(400).send('Invalid product ID format');
  }

  let user = req.session.user;

  // Fetch the product details by ID
  let product = await userHelper.getProductDetails(productId);

  // If no product is found, handle the error
  if (!product) {
    return res.status(404).send('Product not found');
  }

  // Render the place-order page with product details
  res.render('users/place-order', { user, product });
});

router.post('/place-order', async (req, res) => {
  let user = req.session.user;
  let productId = req.body.productId;

  // Fetch product details
  let product = await userHelper.getProductDetails(productId);
  let totalPrice = product.Price; // Get the price from the product

  // Call placeOrder function
  userHelper.placeOrder(req.body, product, totalPrice, user)
    .then((orderId) => {
      if (req.body["payment-method"] === "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    })
    .catch((err) => {
      console.error("Error placing order:", err);
      res.status(500).send("Internal Server Error");
    });
});



router.post("/verify-payment", async (req, res) => {
  console.log(req.body);
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      res.json({ status: false, errMsg: "Payment Failed" });
    });
});

router.get("/order-placed", verifySignedIn, async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  res.render("users/order-placed", { admin: false, user });
});

router.get("/orders", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // Fetch user orders
  let orders = await userHelper.getUserOrder(userId);
  res.render("users/orders", { admin: false, user, orders });
});

router.get("/view-ordered-products/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let orderId = req.params.id;

  // Log the orderId to see if it's correctly retrieved
  console.log("Retrieved Order ID:", orderId);

  // Check if orderId is valid
  if (!ObjectId.isValid(orderId)) {
    console.error('Invalid Order ID format:', orderId);  // Log the invalid ID
    return res.status(400).send('Invalid Order ID');
  }

  try {
    let products = await userHelper.getOrderProducts(orderId);
    res.render("users/order-products", {
      admin: false,
      user,
      products,
    });
  } catch (err) {
    console.error('Error fetching ordered products:', err);
    res.status(500).send('Internal Server Error');
  }
});



router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  userHelper.cancelOrder(orderId).then(() => {
    res.redirect("/orders");
  });
});

router.post("/search", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let userId = req.session.user._id;
  // le = await userHelper.g(userId);
  userHelper.searchProduct(req.body).then((response) => {
    res.render("users/search-result", { admin: false, user, response });
  });
});


router.get("/attendance", verifySignedIn, async function (req, res) {
  try {
    let user = req.session.user;
    if (!user || !user._id) {
      return res.status(403).send("Unauthorized");
    }
    const attendanceData = await userHelper.getAllattendancebyid(user._id);  // ✅ Pass user ID

    console.log("Attendance Data:", JSON.stringify(attendanceData, null, 2)); // Debugging

    res.render("users/dashboard/attendance", {
      admin: false,
      layout: 'layout',
      attendance: attendanceData,
      user
    });

  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).send("Internal Server Error");
  }
});



router.get("/timetable", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  let timetables = await adminHelper.getAllTimetables();
  let teachers = await adminHelper.getAllteachers();

  res.render("users/dashboard/timetable", { admin: false, timetables, user, teachers });
});




router.get("/tasks", verifySignedIn, function (req, res) {
  let user = req.session.user;
  userHelper.getAlltasks().then((tasks) => {
    res.render("users/tasks", { admin: false, tasks, user });
  });
});

router.get("/view-task/:id", verifySignedIn, async function (req, res) {
  let user = req.session.user;
  const taskId = req.params.id;

  try {
    const task = await userHelper.getTaskById(taskId);

    const feedbacks = await userHelper.getFeedbackByTaskId(taskId); // Fetch feedbacks for the specific task


    if (!task) {
      return res.status(404).send("Task not found");
    }

    res.render("users/view-task", {
      admin: false,
      user,
      task,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).send("Server Error");
  }
});




router.post("/add-assignment", async function (req, res) {
  let user = req.session.user; // Ensure the user is logged in and the session is set
  let feedbackText = req.body.text; // Get feedback text from form input
  let username = req.body.username; // Get username from form input
  let taskId = req.body.taskId; // Get task ID from form input
  let teacherId = req.body.teacherId; // Get teacher ID from form input

  if (!user) {
    return res.status(403).send("User not logged in");
  }

  try {
    const feedback = {
      userId: ObjectId(user._id), // Convert user ID to ObjectId
      taskId: ObjectId(taskId), // Convert task ID to ObjectId
      teacherId: ObjectId(teacherId), // Convert teacher ID to ObjectId
      text: feedbackText,
      username: username,
      createdAt: new Date(), // Store the timestamp
      image: "", // Placeholder for image path
    };

    // Check if an image file is uploaded
    if (req.files && req.files.image) {
      let image = req.files.image;
      let imagePath = "./public/images/assignment-images/" + new ObjectId() + path.extname(image.name);

      // Ensure the directory exists
      let dir = "./public/images/assignment-images/";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Move the file to the destination
      await image.mv(imagePath);
      feedback.image = imagePath.replace("./public", ""); // Store relative path
    }

    await userHelper.addFeedback(feedback);
    res.redirect("/view-task/" + taskId); // Redirect back to the task page
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).send("Server Error");
  }
});



router.get("/single-task/:id", async function (req, res) {
  let user = req.session.user;
  const taskId = req.params.id;

  try {
    const task = await userHelper.getTaskById(taskId);

    if (!task) {
      return res.status(404).send("Task not found");
    }
    const feedbacks = await userHelper.getFeedbackByTaskId(taskId); // Fetch feedbacks for the specific task

    res.render("users/single-task", {
      admin: false,
      user,
      task,
      feedbacks
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
