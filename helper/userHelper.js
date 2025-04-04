var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
const ObjectId = require('mongodb').ObjectId; // Required to convert string to ObjectId


var instance = new Razorpay({
  key_id: "rzp_test_8NokNgt8cA3Hdv",
  key_secret: "xPzG53EXxT8PKr34qT7CTFm9",
});

module.exports = {


  getleavesById: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch leaves based on userId (converted to ObjectId)
        const leaves = await db.get()
          .collection(collections.LEAVE_COLLECTION)
          .find({ userId: ObjectId(userId) }) // Filter by logged-in userId
          .toArray();

        resolve(leaves);
      } catch (error) {
        reject(error);
      }
    });
  },
  applyForJob: async (jobId, applicantData) => {
    return await db.get().collection(collections.APPLICATIONS_COLLECTION).insertOne({ 
        jobId: ObjectId(jobId), 
        ...applicantData 
    });
},
getFeesById:(cls)=>{
  return new Promise(async (resolve, reject) => {
        try {
          // Fetch exams based on teacherId (converted to ObjectId)
          const exams = await db.get()
            .collection(collections.FEES_COLLECTION)
            .find({ classname
              : cls }) // Filter by logged-in userId
            .toArray();
  
          resolve(exams);
        } catch (error) {
          reject(error);
        }
      });

},
getResultById: (cls, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch exams with matching classname and containing results for the user
      const exams = await db.get()
        .collection(collections.EXAM_COLLECTION)
        .aggregate([
          { $match: { classname: cls, isResult: "true" } }, // Match exams in the given class
          { 
            $unwind: "$results" // Expand results array
          },
          { 
            $match: { "results.studentId": userId } // Filter results for the specific student
          },
          {
            $project: {
              _id: 1,
              date: 1,
              no: 1,
              subject: 1,
              classname: 1,
              "results.mark": 1,
              "results.internal": 1,
              "results.status": 1,
              "results.fullmark":1,
              createdAt: 1,
              updatedAt:1
            }
          }
        ])
        .toArray();

      resolve(exams);
    } catch (error) {
      reject(error);
    }
  });
},
getStudymaterialById:(cls,id)=>{
  return new Promise(async (resolve, reject) => {
        try {
          // Fetch exams based on teacherId (converted to ObjectId)
          const exams = await db.get()
            .collection(collections.MATERIAL_COLLECTION)
            .find({ classname
              : cls }) // Filter by logged-in userId
            .toArray();
  
          resolve(exams);
        } catch (error) {
          reject(error);
        }
      });

},
setAnswer:async (Id,answerObj)=>{
  console.log("answerObjanswerObj-",answerObj,"-answerObjanswerObj")
  let answers = [];
  Object.keys(answerObj).forEach(key => {
    // Use regex to extract the numeric index from keys like "answers[0]"
    const match = key.match(/^answers\[(\d+)\]$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      answers[idx] = answerObj[key];
    }
  });
  try {
    const result = await db.get()
    .collection(collections.SURVEY_COLLECTION)
    .updateOne(
      { _id: ObjectId(Id) },
      { $set: { answers: answers ,
        isAnswered:true} }
    );
  return result;
      }catch (err) {
        console.error("Error saving assessment:", err);
        throw err;
      }

},
getSurveyById:(cls,id)=>{
  return new Promise(async (resolve, reject) => {
        try {
          // Fetch exams based on teacherId (converted to ObjectId)
          const exams = await db.get()
            .collection(collections.SURVEY_COLLECTION)
            .find({ classname
              : cls }) // Filter by logged-in userId
            .toArray();
  
          resolve(exams);
        } catch (error) {
          reject(error);
        }
      });

},
getAssessmentsId: async(Id)=> {
  
  try {
    const result = await db.get().collection(collections.SURVEY_COLLECTION).findOne({_id:objectId(Id)      });
    return result;
  } catch (err) {
    console.error("Error saving assessment:", err);
    throw err;
  }
},
  getexamById:(cls)=>{
    return new Promise(async (resolve, reject) => {
          try {
            // Fetch exams based on teacherId (converted to ObjectId)
            const exams = await db.get()
              .collection(collections.EXAM_COLLECTION)
              .find({ classname
                : cls }) // Filter by logged-in userId
              .toArray();
    
            resolve(exams);
          } catch (error) {
            reject(error);
          }
        });

  },



  getleavesByIdT: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch leaves based on teacherId (converted to ObjectId)
        const leaves = await db.get()
          .collection(collections.TLEAVE_COLLECTION)
          .find({ teacherId: ObjectId(teacherId) }) // Filter by logged-in userId
          .toArray();

        resolve(leaves);
      } catch (error) {
        reject(error);
      }
    });
  },




  getAlltasks: () => {
    return new Promise(async (resolve, reject) => {
      let tasks = await db
        .get()
        .collection(collections.TASK_COLLECTION)
        .find()
        .toArray();
      resolve(tasks);
    });
  },
  getAlltasksId: (id) => {
    return new Promise(async (resolve, reject) => {
      let tasks = await db
        .get()
        .collection(collections.TASK_COLLECTION)
        .find()
        .toArray();
      
      resolve(tasks);
    });
  },


  getFeedbackByTaskId: (taskId ,id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .findOne({ taskId: ObjectId(taskId) ,userId:ObjectId(id)}) // Convert taskId to ObjectId

        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },


  getTaskById: (taskId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const task = await db.get()
          .collection(collections.TASK_COLLECTION)
          .findOne({ _id: ObjectId(taskId) }); // Convert taskId to ObjectId
        resolve(task);
      } catch (error) {
        reject(error);
      }
    });
  },



  ///////All Attendance/////////////////////                                         
  getAllattendance: () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch attendance with necessary details using aggregation
        let attendance = await db
          .get()
          .collection(collections.ATTENDANCE_COLLECTION)
          .aggregate([
            {
              // Lookup for teacher details
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacherId",  // Teacher ID in the attendance collection
                foreignField: "_id",  // Match with the _id in the teachers collection
                as: "teacherDetails"  // Output as teacherDetails array
              }
            },
            {
              // Unwind teacherDetails to extract single teacher object
              $unwind: {
                path: "$teacherDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              // Lookup for subject details
              $lookup: {
                from: collections.SUBJECT_COLLECTION,
                localField: "subjectId",  // Subject ID in the attendance collection
                foreignField: "_id",  // Match with the _id in the subjects collection
                as: "subjectDetails"  // Output as subjectDetails array
              }
            },
            {
              // Unwind subjectDetails to extract single subject object
              $unwind: {
                path: "$subjectDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              // Lookup for selected users details
              $lookup: {
                from: collections.USERS_COLLECTION,
                localField: "selectedUsers",  // Selected user IDs in the attendance collection
                foreignField: "_id",  // Match with _id in the users collection
                as: "selectedUserDetails"  // Output as selectedUserDetails array
              }
            },
            {
              // Project necessary fields
              $project: {
                date: 1,
                subject: 1,
                teacherName: { $ifNull: ["$teacherDetails.Name", ""] },  // Teacher's name
                subjectName: { $ifNull: ["$subjectDetails.sname", ""] },  // Subject name
                selectedUsers: "$selectedUserDetails.Fname",  // User's first name from selected users
              }
            }
          ])
          .toArray();

        // Resolve with the fetched attendance details
        resolve(attendance);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        reject(err);  // Reject if an error occurs
      }
    });
  },


  ///////All Attendance by id/////////////////////                                         
  getAllattendancebyid: (userId) => {  // Accept userId as a parameter
    return new Promise(async (resolve, reject) => {
      try {
        let attendance = await db
          .get()
          .collection(collections.ATTENDANCE_COLLECTION)
          .aggregate([
            {
              // Filter attendance for the logged-in user
              $match: {
                selectedUsers: new ObjectId(userId)  // ✅ Match userId in the selectedUsers array
              }
            },
            {
              // Lookup for teacher details
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacherId",
                foreignField: "_id",
                as: "teacherDetails"
              }
            },
            {
              // Unwind teacherDetails to extract a single teacher object
              $unwind: {
                path: "$teacherDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              // Lookup for subject details
              $lookup: {
                from: collections.SUBJECT_COLLECTION,
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
              }
            },
            {
              // Unwind subjectDetails to extract a single subject object
              $unwind: {
                path: "$subjectDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              // Lookup for selected user details
              $lookup: {
                from: collections.USERS_COLLECTION,
                localField: "selectedUsers",
                foreignField: "_id",
                as: "selectedUserDetails"
              }
            },
            {
              // Project necessary fields
              $project: {
                date: 1,
                subject: 1,
                teacherName: { $ifNull: ["$teacherDetails.Companyname", ""] },
                subjectName: { $ifNull: ["$subjectDetails.sname", ""] },
                selectedUsers: "$selectedUserDetails.Fname",  // User's first name from selected users
              }
            }
          ])
          .toArray();

        resolve(attendance);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        reject(err);
      }
    });
  },
  getSubjectWiseAttendance: async (userId, className, sem) => {
    try {
        const attendanceCollection = await db.get().collection(collections.ATTENDANCE_COLLECTION);

        const results = await attendanceCollection.aggregate([
            {
                $match: {
                    sem: sem,
                    classname: className, // ✅ Filter by class
                    $or: [
                        { present: { $elemMatch: { $eq: ObjectId(userId) } } },
                        { absent: { $elemMatch: { $eq: ObjectId(userId) } } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        subject: "$subject",
                        teacherId: "$teacherId",
                        subjectId: "$subjectId"
                    },
                    totalClass: { $sum: 1 }, // ✅ Count total periods for each subject
                    attendedClass: {
                        $sum: {
                            $cond: [{ $in: [ObjectId(userId), "$present"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    subject: "$_id.subject",
                    teacherId: "$_id.teacherId",
                    subjectId: "$_id.subjectId",
                    sem: sem,
                    totalClass: 1,
                    attendedClass: 1,
                    percentage: {
                        $round: [{ $multiply: [{ $divide: ["$attendedClass", "$totalClass"] }, 100] }, 2]
                    } // ✅ Calculate attendance percentage
                }
            }
        ]).toArray();

        console.log(JSON.stringify(results))

        return results;
    } catch (error) {
        console.error("Error in getSubjectWiseAttendance:", error);
        throw error;
    }
},

  getDayWiseAttendance: async (userId, className, sem) => {
    try {
        const attendanceCollection = await db.get().collection(collections.ATTENDANCE_COLLECTION);

        const results = await attendanceCollection.aggregate([
            {
                $match: {
                    classname: className, // ✅ Match class
                    sem: sem,            // ✅ Match semester
                    $or: [
                        { present: ObjectId(userId) },
                        { absent: ObjectId(userId) }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        date: "$selectedDate",
                        period: "$period",
                        subject: "$subject",
                        teacherId: "$teacherId",
                        subjectId: "$subjectId"
                    },
                    totalClasses: { $sum: 1 }, // ✅ Count total occurrences per period
                    attendedClasses: {
                        $sum: {
                            $cond: [{ $in: [ObjectId(userId), "$present"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.date", // ✅ Group by date
                    subjects: {
                        $push: {
                            subject: "$_id.subject",
                            teacherId: "$_id.teacherId",
                            subjectId: "$_id.subjectId",
                            period: "$_id.period",
                            present: { $gt: ["$attendedClasses", 0] },
                            totalClasses: "$totalClasses",
                            attendedClasses: "$attendedClasses",
                            percentage: {
                                $multiply: [
                                    { $divide: ["$attendedClasses", "$totalClasses"] },
                                    100
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    subjects: {
                      $sortArray: {
                          input: "$subjects",
                          sortBy: { period: 1 }
                      }
                  },
                    present: {
                        $gt: [
                            { $size: { $filter: { input: "$subjects", as: "s", cond: "$$s.present" } } },
                            0
                        ]
                    }
                }
            },
            { $sort: { date: 1 } } // ✅ Sort by date
        ]).toArray();
        
        console.log(JSON.stringify(results),"llklkj")
        return results;
    } catch (error) {
        console.error("Error in getDayWiseAttendance:", error);
        throw error;
    }
},



  getnotificationById: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch notifications based on userId (converted to ObjectId)
        const notifications = await db.get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .find({ userId: ObjectId(userId) }) // Filter by logged-in userId
          .toArray();

        resolve(notifications);
      } catch (error) {
        reject(error);
      }
    });
  },


  addFeedback: (feedback) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .insertOne(feedback);
        resolve(); // Resolve the promise on success
      } catch (error) {
        reject(error); // Reject the promise on error
      }
    });
  },




  addLeave: (leave, callback) => {
    console.log(leave);

    // Convert userId to ObjectId
    if (leave.userId) {
      leave.userId = new ObjectId(leave.userId);
    }

    db.get()
      .collection(collections.LEAVE_COLLECTION)
      .insertOne(leave)
      .then((data) => {
        console.log(data);
        callback(data.insertedId);
      })
      .catch((err) => {
        console.error("Error inserting leave:", err);
        callback(null);
      });
  },




  addLeaveT: (tleave, callback) => {
    console.log(tleave);

    // Convert userId to ObjectId
    if (tleave.teacherId) {
      tleave.teacherId = new ObjectId(tleave.teacherId);
    }

    db.get()
      .collection(collections.TLEAVE_COLLECTION)
      .insertOne(tleave)
      .then((data) => {
        console.log(data);
        callback(data.insertedId);
      })
      .catch((err) => {
        console.error("Error inserting tleave:", err);
        callback(null);
      });
  },



  getFeedbackByProductId: (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ productId: ObjectId(productId) }) // Convert productId to ObjectId
          .toArray();

        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },


  getTeacherById: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const teacher = await db.get()
          .collection(collections.TEACHER_COLLECTION)
          .findOne({ _id: ObjectId(teacherId) });
        resolve(teacher);
      } catch (error) {
        reject(error);
      }
    });
  },








  ///////GET ALL product/////////////////////     

  getAllproducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getProductById: (productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await db.get()
          .collection(collections.PRODUCTS_COLLECTION)
          .findOne({ _id: ObjectId(productId) }); // Convert productId to ObjectId
        resolve(product);
      } catch (error) {
        reject(error);
      }
    });
  },

  // getAllproducts: (teacherId) => {
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db
  //       .get()
  //       .collection(collections.PRODUCTS_COLLECTION)
  //       .find({ teacherId: objectId(teacherId) }) // Filter by teacherId
  //       .toArray();
  //     resolve(products);
  //   });
  // },

  /////// product DETAILS/////////////////////                                            
  getproductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({
          _id: objectId(productId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCTS_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Hash the password
        userData.Password = await bcrypt.hash(userData.Password, 10);

        // Set default values
        userData.isDisable = false;  // User is not disabled by default
        userData.createdAt = new Date();  // Set createdAt to the current date and time

        // Insert the user into the database
        db.get()
          .collection(collections.USERS_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            // Resolve with the inserted user data
            resolve(data.ops[0]);
          })
          .catch((err) => {
            // Reject with any error during insertion
            reject(err);
          });
      } catch (err) {
        reject(err);  // Reject in case of any error during password hashing
      }
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      // Find user by email
      let user = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ Email: userData.Email });

      // If user exists, check if the account is disabled
      if (user) {
        if (user.isDisable) {
          // If the account is disabled, return the msg from the user collection
          response.status = false;
          response.msg = user.msg || "Your account has been disabled.";
          return resolve(response);
        }

        // Compare passwords
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.user = user;
            response.status = true;
            resolve(response);  // Successful login
          } else {
            console.log("Login Failed");
            resolve({ status: false });  // Invalid password
          }
        });
      } else {
        console.log("Login Failed");
        resolve({ status: false });  // User not found
      }
    });
  },

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((user) => {
          resolve(user);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  updateUserProfile: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Fname: userDetails.Fname,
              Lname: userDetails.Lname,
              Email: userDetails.Email,
              Phone: userDetails.Phone,
              Address: userDetails.Address,
              District: userDetails.District,
              Pincode: userDetails.Pincode,
            },
          }
        )
        .then((response) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },


  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCTS_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      console.log(total[0].total);
      resolve(total[0].total);
    });
  },




  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      if (!ObjectId.isValid(productId)) {
        reject(new Error('Invalid product ID format'));
        return;
      }

      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: ObjectId(productId) })
        .then((product) => {
          if (!product) {
            reject(new Error('Product not found'));
          } else {
            // Assuming the product has a teacherId field
            resolve(product);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  },




  placeOrder: (order, product, total, user) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(order, product, total);
        let status = order["payment-method"] === "COD" ? "placed" : "pending";

        // Get the product document to check the current seat value
        const productDoc = await db.get()
          .collection(collections.PRODUCTS_COLLECTION)
          .findOne({ _id: objectId(product._id) });

        // Check if the product exists and the seat field is present
        if (!productDoc || !productDoc.seat) {
          return reject(new Error("Product not found or seat field is missing."));
        }

        // Convert seat from string to number and check availability
        let seatCount = Number(productDoc.seat);
        if (isNaN(seatCount) || seatCount <= 0) {
          return reject(new Error("Seat is not available."));
        }

        // Create the order object
        let orderObject = {
          deliveryDetails: {
            Fname: order.Fname,
            Lname: order.Lname,
            Email: order.Email,
            Phone: order.Phone,
            Address: order.Address,
            District: order.District,
            State: order.State,
            Pincode: order.Pincode,
            selecteddate: order.selecteddate,
          },
          userId: objectId(order.userId),
          user: user,
          paymentMethod: order["payment-method"],
          product: product,
          totalAmount: total,
          status: status,
          date: new Date(),
          teacherId: product.teacherId, // Store the teacher's ID
        };

        // Insert the order into the database
        const response = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .insertOne(orderObject);

        // Decrement the seat count
        seatCount -= 1; // Decrement the seat count

        // Convert back to string and update the product seat count
        await db.get()
          .collection(collections.PRODUCTS_COLLECTION)
          .updateOne(
            { _id: objectId(product._id) },
            { $set: { seat: seatCount.toString() } } // Convert number back to string
          );

        resolve(response.ops[0]._id);
      } catch (error) {
        console.error("Error placing order:", error);
        reject(error);
      }
    });
  },


  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ userId: ObjectId(userId) }) // Use 'userId' directly, not inside 'orderObject'
          .toArray();

        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let products = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .aggregate([
            {
              $match: { _id: objectId(orderId) }, // Match the order by its ID
            },
            {
              $project: {
                // Include product, user, and other relevant fields
                product: 1,
                user: 1,
                paymentMethod: 1,
                totalAmount: 1,
                status: 1,
                date: 1,
                deliveryDetails: 1, // Add deliveryDetails to the projection

              },
            },
          ])
          .toArray();

        resolve(products[0]); // Fetch the first (and likely only) order matching this ID
      } catch (error) {
        reject(error);
      }
    });
  },

  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        console.log("New Order : ", order);
        resolve(order);
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "xPzG53EXxT8PKr34qT7CTFm9");

      hmac.update(
        details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "orderObject.status": "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
    });
  },

  searchProduct: (details) => {
    console.log(details);
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .createIndex({ Name: "text" }).then(async () => {
          let result = await db
            .get()
            .collection(collections.PRODUCTS_COLLECTION)
            .find({
              $text: {
                $search: details.search,
              },
            })
            .toArray();
          resolve(result);
        })

    });
  },
};
