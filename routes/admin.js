var express = require("express");
var adminHelper = require("../helper/adminHelper");
var fs = require("fs");
const userHelper = require("../helper/userHelper");
var router = express.Router();
var db = require("../config/connection");
var collections = require("../config/collections");
const ObjectId = require("mongodb").ObjectID;

const verifySignedIn = (req, res, next) => {
  if (req.session.signedInAdmin) {
    next();
  } else {
    res.redirect("/admin/signin");
  }
};

/* GET admins listing. */
router.get("/", verifySignedIn, function (req, res, next) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/home", { admin: true, products, layout: "admin-layout", administator });
  });
});



router.get("/all-notifications", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let notifications = await adminHelper.getAllnotifications();
  res.render("admin/all-notifications", { admin: true, layout: "admin-layout", administator, notifications });
});

///////ADD reply/////////////////////                                         
router.get("/add-notification", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let users = await adminHelper.getAllUsers();
  res.render("admin/add-notification", { admin: true, layout: "admin-layout", administator, users });
});

///////ADD notification/////////////////////                                         
router.post("/add-notification", function (req, res) {
  adminHelper.addnotification(req.body, (id) => {
    res.redirect("/admin/all-notifications");
  });
});

router.get("/delete-notification/:id", verifySignedIn, function (req, res) {
  let notificationId = req.params.id;
  adminHelper.deletenotification(notificationId).then((response) => {
    res.redirect("/admin/all-notifications");
  });
});

///////ALL teacher/////////////////////                                         
router.get("/all-teachers", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllteachers().then((teachers) => {
    res.render("admin/teacher/all-teachers", { admin: true, layout: "admin-layout", teachers, administator });
  });
});



router.post("/approve-teacher/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.TEACHER_COLLECTION).updateOne(
    { _id: ObjectId(req.params.id) },
    { $set: { approved: true } }
  );
  res.redirect("/admin/all-teachers");
});

router.post("/reject-teacher/:id", function (req, res) {
  const teacherId = req.params.id;
  db.get()
    .collection(collections.TEACHER_COLLECTION)
    .updateOne({ _id: ObjectId(teacherId) }, { $set: { approved: false, rejected: true } })
    .then(() => {
      res.redirect("/admin/all-teachers");
    })
    .catch((err) => {
      console.error(err);
      res.redirect("/admin/all-teachers");
    });
});


router.post("/delete-teacher/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.TEACHER_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/all-teachers");
});

///////ADD teacher/////////////////////                                         
router.get("/add-teacher", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/teacher/add-teacher", { admin: true, layout: "admin-layout", administator });
});

///////ADD teacher/////////////////////                                         
router.post("/add-teacher", function (req, res) {
  adminHelper.addteacher(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/images/teacher-images/" + id + ".png", (err, done) => {
      if (!err) {
        res.redirect("/admin/teacher/all-teachers");
      } else {
        console.log(err);
      }
    });
  });
});

///////EDIT teacher/////////////////////                                         
router.get("/edit-teacher/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let teacherId = req.params.id;
  let teacher = await adminHelper.getteacherDetails(teacherId);
  console.log(teacher);
  res.render("admin/teacher/edit-teacher", { admin: true, layout: "admin-layout", teacher, administator });
});

///////EDIT teacher/////////////////////                                         
router.post("/edit-teacher/:id", verifySignedIn, function (req, res) {
  let teacherId = req.params.id;
  adminHelper.updateteacher(teacherId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/teacher-images/" + teacherId + ".png");
      }
    }
    res.redirect("/admin/teacher/all-teachers");
  });
});

///////DELETE teacher/////////////////////                                         
// router.get("/delete-teacher/:id", verifySignedIn, function (req, res) {
//   let teacherId = req.params.id;
//   adminHelper.deleteteacher(teacherId).then((response) => {
//     res.redirect("/admin/all-teachers");
//   });
// });

///////DELETE ALL teacher/////////////////////                                         
router.get("/delete-all-teachers", verifySignedIn, function (req, res) {
  adminHelper.deleteAllteachers().then(() => {
    res.redirect("/admin/teacher/all-teachers");
  });
});

router.get("/all-products", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllProducts().then((products) => {
    res.render("admin/all-products", { admin: true, layout: "admin-layout", products, administator });
  });
});

router.get("/signup", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signup", {
      admin: true, layout: "admin-empty",
      signUpErr: req.session.signUpErr,
    });
  }
});

router.post("/signup", function (req, res) {
  adminHelper.doSignup(req.body).then((response) => {
    console.log(response);
    if (response.status == false) {
      req.session.signUpErr = "Invalid Admin Code";
      res.redirect("/admin/signup");
    } else {
      req.session.signedInAdmin = true;
      req.session.admin = response;
      res.redirect("/admin");
    }
  });
});

router.get("/signin", function (req, res) {
  if (req.session.signedInAdmin) {
    res.redirect("/admin");
  } else {
    res.render("admin/signin", {
      admin: true, layout: "admin-empty",
      signInErr: req.session.signInErr,
    });
    req.session.signInErr = null;
  }
});

router.post("/signin", function (req, res) {
  adminHelper.doSignin(req.body).then((response) => {
    if (response.status) {
      req.session.signedInAdmin = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.signInErr = "Invalid Email/Password";
      res.redirect("/admin/signin");
    }
  });
});

router.get("/signout", function (req, res) {
  req.session.signedInAdmin = false;
  req.session.admin = null;
  res.redirect("/admin");
});

router.get("/add-product", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  res.render("admin/add-product", { admin: true, layout: "admin-layout", administator });
});

router.post("/add-product", function (req, res) {
  adminHelper.addProduct(req.body, (id) => {
    res.redirect("/admin/all-products");

  });
});

router.get("/edit-product/:id", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let productId = req.params.id;
  let product = await adminHelper.getProductDetails(productId);
  console.log(product);
  res.render("admin/edit-product", { admin: true, layout: "admin-layout", product, administator });
});

router.post("/edit-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.updateProduct(productId, req.body).then(() => {
    if (req.files) {
      let image = req.files.Image;
      if (image) {
        image.mv("./public/images/product-images/" + productId + ".png");
      }
    }
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-product/:id", verifySignedIn, function (req, res) {
  let productId = req.params.id;
  adminHelper.deleteProduct(productId).then((response) => {
    res.redirect("/admin/all-products");
  });
});

router.get("/delete-all-products", verifySignedIn, function (req, res) {
  adminHelper.deleteAllProducts().then(() => {
    res.redirect("/admin/all-products");
  });
});

router.get("/all-users", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllUsers().then((users) => {
    res.render("admin/users/all-users", { admin: true, layout: "admin-layout", administator, users });
  });
});
router.get("/view-user/:id", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  let id=req.params.id;
  adminHelper.getUserById(id).then((users) => {
    res.render("admin/users/view-user", { admin: true, layout: "admin-layout", administator, users });
  });
});

router.get("/view-teacher/:id", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  let id=req.params.id;
  adminHelper.getTeacherById(id).then((users) => {
    res.render("admin/teacher/view-teacher", { admin: true, layout: "admin-layout", administator, users });
  });
});




router.get("/all-t-leave", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllTleaves().then((tleaves) => {
    res.render("admin/leaves/all-t-leave", { admin: true, layout: "admin-layout", administator, tleaves });
  });
});



router.get("/all-s-leave", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.getAllSleaves().then((sleaves) => {
    res.render("admin/leaves/all-s-leave", { admin: true, layout: "admin-layout", administator, sleaves });
  });
});
router.post("/block-teacher/:id", (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  // Update the user in the database to set isDisable to true and add the reason
  db.get()
    .collection(collections.TEACHER_COLLECTION)
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isDisable: true, reason: reason } }
    )
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error('Error blocking user:', err);
      res.json({ success: false });
    });
});


router.post("/block-user/:id", (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  // Update the user in the database to set isDisable to true and add the reason
  db.get()
    .collection(collections.USERS_COLLECTION)
    .updateOne(
      { _id: new ObjectId(userId) },
      { $set: { isDisable: true, reason: reason } }
    )
    .then(() => res.json({ success: true }))
    .catch(err => {
      console.error('Error blocking user:', err);
      res.json({ success: false });
    });
});



router.get("/remove-all-users", verifySignedIn, function (req, res) {
  adminHelper.removeAllUsers().then(() => {
    res.redirect("/admin/all-users");
  });
});

router.get("/all-orders", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let { fromDate, toDate } = req.query; // Get fromDate and toDate from the query parameters

  try {
    let orders = await adminHelper.getAllOrders(fromDate, toDate); // Pass the date range to the function

    res.render("admin/finance", {
      admin: true,
      layout: "admin-layout",
      administator,
      orders,     // Render the filtered orders
      fromDate,   // Pass back toDate and fromDate to display on the form
      toDate
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Server Error");
  }
});


router.get(
  "/view-ordered-products/:id",
  verifySignedIn,
  async function (req, res) {
    let administator = req.session.admin;
    let orderId = req.params.id;
    let products = await userHelper.getOrderProducts(orderId);
    res.render("admin/order-products", {
      admin: true, layout: "admin-layout",
      administator,
      products,
    });
  }
);

router.get("/change-status/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let orderId = req.query.orderId;
  adminHelper.changeStatus(status, orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});


router.get("/change-status-leave/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let tleaveId = req.query.tleaveId;
  adminHelper.changeStatusLeave(status, tleaveId).then(() => {
    res.redirect("/admin/leaves/all-t-leave");
  });
});


router.get("/change-status-leave-s/", verifySignedIn, function (req, res) {
  let status = req.query.status;
  let sleaveId = req.query.sleaveId;
  adminHelper.changeStatusLeaveS(status, sleaveId).then(() => {
    res.redirect("/admin/leaves/all-s-leave");
  });
});


router.get("/cancel-order/:id", verifySignedIn, function (req, res) {
  let orderId = req.params.id;
  adminHelper.cancelOrder(orderId).then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.get("/cancel-all-orders", verifySignedIn, function (req, res) {
  adminHelper.cancelAllOrders().then(() => {
    res.redirect("/admin/all-orders");
  });
});

router.post("/search", verifySignedIn, function (req, res) {
  let administator = req.session.admin;
  adminHelper.searchProduct(req.body).then((response) => {
    res.render("admin/search-result", { admin: true, layout: "admin-layout", administator, response });
  });
});


///////////////////////////////////////////////////////////////

///////ALL subjects/////////////////////                                         
router.get("/all-subjects", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let subjects = await adminHelper.getAllSubjects();
  let teachers = await adminHelper.getAllteachers();
  console.log(subjects,":::::;")

  res.render("admin/subjects/all-subjects", { admin: true, layout: "admin-layout", subjects, administator, teachers });
});

///////ADD teacher/////////////////////                                         
router.post("/add-subject", function (req, res) {
  adminHelper.addSubject(req.body, (id) => {
    res.redirect("/admin/subjects/all-subjects");

  });
});

router.post("/delete-subject/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.SUBJECT_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/subjects/all-subjects");
});


///////ALL timetables/////////////////////                                         
router.get("/all-timetables", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  let timetables = await adminHelper.getAllTimetables();
  let teachers = await adminHelper.getAllTeachersWithSubjects();
  console.log("_____",teachers,"*****")

  res.render("admin/timetables/all-timetables", { admin: true, layout: "admin-layout", timetables, administator, teachers });
});

///////ADD teacher/////////////////////                                         
router.post("/add-timetable", function (req, res) {
  adminHelper.addTimetable(req.body, (id) => {
    res.redirect("/admin/timetables/all-timetables");

  });
});

router.post("/delete-timetable/:id", verifySignedIn, async function (req, res) {
  await db.get().collection(collections.TIMETABLE_COLLECTION).deleteOne({ _id: ObjectId(req.params.id) });
  res.redirect("/admin/timetables/all-timetables");
});



///////ALL attendances/////////////////////                                         
router.get("/all-attendances", verifySignedIn, async function (req, res) {
  let administator = req.session.admin;
  const attendanceData = await adminHelper.getAllattendance();
  console.log("Attendance Data:", JSON.stringify(attendanceData, null, 2)); // Debugging
  res.render("admin/attendance/all-attendances", { admin: true, layout: "admin-layout", attendance: attendanceData, administator });
});




module.exports = router;
