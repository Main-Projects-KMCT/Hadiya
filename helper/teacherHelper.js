var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;

module.exports = {



  getexamById: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch exams based on teacherId (converted to ObjectId)
        const exams = await db.get()
          .collection(collections.EXAM_COLLECTION)
          .find({ teacherId: objectId(teacherId) }) // Filter by logged-in userId
          .toArray();

        resolve(exams);
      } catch (error) {
        reject(error);
      }
    });
  },


  addexam: (exam, teacherId, callback) => {
    if (!teacherId || !objectId.isValid(teacherId)) {
      return callback(null, new Error("Invalid or missing teacherId"));
    }

    exam.createdAt = new Date(); // Set createdAt as the current date and time
    exam.teacherId = objectId(teacherId); // Associate exam with the teacher

    db.get()
      .collection(collections.EXAM_COLLECTION)
      .insertOne(exam)
      .then((data) => {
        callback(data.ops[0]._id); // Return the inserted exam ID
      })
      .catch((error) => {
        callback(null, error);
      });
  },



  deleteexam: (examId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.EXAM_COLLECTION)
        .removeOne({
          _id: objectId(examId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },


  ///////ADD task/////////////////////                                         
  addtask: (task, teacherId, callback) => {
    if (!teacherId || !objectId.isValid(teacherId)) {
      return callback(null, new Error("Invalid or missing teacherId"));
    }

    task.Price = parseInt(task.Price);
    task.teacherId = objectId(teacherId); // Associate task with the teacher

    db.get()
      .collection(collections.TASK_COLLECTION)
      .insertOne(task)
      .then((data) => {
        callback(data.ops[0]._id); // Return the inserted task ID
      })
      .catch((error) => {
        callback(null, error);
      });
  },



  ///////GET ALL task/////////////////////                                            
  getAlltasks: () => {
    return new Promise(async (resolve, reject) => {
      let tasks = await db
        .get()
        .collection(collections.TASK_COLLECTION)
        .find() // Filter by teacherId
        .toArray();
      resolve(tasks);
    });
  },

  ///////ADD task DETAILS/////////////////////                                            
  gettaskDetails: (taskId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TASK_COLLECTION)
        .findOne({
          _id: objectId(taskId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE task/////////////////////                                            
  deletetask: (taskId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TASK_COLLECTION)
        .removeOne({
          _id: objectId(taskId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE task/////////////////////                                            
  updatetask: (taskId, taskDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TASK_COLLECTION)
        .updateOne(
          {
            _id: objectId(taskId)
          },
          {
            $set: {
              wname: taskDetails.wname,
              seat: taskDetails.seat,
              Price: taskDetails.Price,
              format: taskDetails.format,
              desc: taskDetails.desc,
              baddress: taskDetails.baddress,

            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },



  addattendance: (attendance, callback) => {

    const present = Array.isArray(attendance.present)
      ? attendance.present
      : attendance.present ? [attendance.present] : [];

    const absent = Array.isArray(attendance.absent)
      ? attendance.absent
      : attendance.absent ? [attendance.absent] : [];



    const attendanceData = {
      date: attendance.date,
      selectedDate: attendance.selectedDate,
      period: attendance.period,
      Class: attendance.Class,
      teacherId: new objectId(attendance.teacherId),  // Convert to objectId
      subjectId: new objectId(attendance.subjectId),  // Convert to objectId
      subject: attendance.subject,  // Subject name remains as string
      present: present.map(id => new objectId(id)),
      absent: absent.map(id => new objectId(id)),

    };

    db.get()
      .collection(collections.ATTENDANCE_COLLECTION)
      .insertOne(attendanceData)
      .then((data) => {
        console.log("Attendance added:", data);
        callback(data.insertedId); // Return inserted ID
      })
      .catch((err) => {
        console.error("Error adding attendance:", err);
        callback(null); // Handle errors appropriately
      });
  },




  ///////ADD notification/////////////////////                                         
  addnotification: (notification, callback) => {
    // Convert teacherId and userId to ObjectId if they are provided in the notification
    if (notification.teacherId) {
      notification.teacherId = objectId(notification.teacherId); // Convert teacherId to objectId
    }

    if (notification.userId) {
      notification.userId = objectId(notification.userId); // Convert userId to ObjectId
    }

    notification.createdAt = new Date(); // Set createdAt as the current date and time

    console.log(notification);  // Log notification to check the changes

    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .insertOne(notification)
      .then((data) => {
        console.log(data);  // Log the inserted data for debugging
        callback(data.ops[0]._id);  // Return the _id of the inserted notification
      })
      .catch((err) => {
        console.error("Error inserting notification:", err);
        callback(null, err);  // Pass error back to callback
      });
  },

  ///////GET ALL notification/////////////////////   

  getAllnotifications: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch notifications by teacherId and populate user details
        let notifications = await db
          .get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .aggregate([
            // Match notifications by teacherId
            {
              $match: { "teacherId": objectId(teacherId) }
            },
            // Lookup user details based on userId
            {
              $lookup: {
                from: collections.USERS_COLLECTION, // Assuming your users collection is named 'USERS_COLLECTION'
                localField: "userId", // Field in notifications collection
                foreignField: "_id", // Field in users collection
                as: "userDetails" // Name of the array where the user details will be stored
              }
            },
            // Unwind the userDetails array to get a single document (since $lookup returns an array)
            {
              $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
            }
          ])
          .toArray();

        resolve(notifications);
      } catch (error) {
        reject(error);
      }
    });
  },


  ///////ADD notification DETAILS/////////////////////                                            
  getnotificationDetails: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .findOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE notification/////////////////////                                            
  deletenotification: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .removeOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE notification/////////////////////                                            
  updatenotification: (notificationId, notificationDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .updateOne(
          {
            _id: objectId(notificationId)
          },
          {
            $set: {
              Name: notificationDetails.Name,
              Category: notificationDetails.Category,
              Price: notificationDetails.Price,
              Description: notificationDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL notification/////////////////////                                            
  deleteAllnotifications: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATION_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },



  getFeedbackByTeacherId: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const feedbacks = await db.get()
          .collection(collections.FEEDBACK_COLLECTION)
          .find({ teacherId: objectId(teacherId) }) // Convert teacherId to ObjectId
          .toArray();
        resolve(feedbacks);
      } catch (error) {
        reject(error);
      }
    });
  },
  getTeacherClass: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let timetables = await db
          .get()
          .collection(collections.TIMETABLE_COLLECTION)
          .aggregate([
            {
              $match: {
                $or: [
                  { period1: { $regex: `^${teacherId}\\|` } },
                  { period2: { $regex: `^${teacherId}\\|` } },
                  { period3: { $regex: `^${teacherId}\\|` } },
                  { period4: { $regex: `^${teacherId}\\|` } },
                  { period5: { $regex: `^${teacherId}\\|` } },
                  { period6: { $regex: `^${teacherId}\\|` } }
                ]
              }
            },
            {
              $group: {
                _id: "$class" // Group by class name to get unique class names
              }
            },
            {
              $project: {
                _id: 0,
                className: "$_id" // Rename field for output
              }
            }
          ])
          .toArray();
          console.log(JSON.stringify(timetables),"clssssssss")
  
        resolve(timetables); // Return the list of class names
      } catch (err) {
        reject(err);
      }
    });
  }, 
  getTeacherSubject: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let timetables = await db
          .get()
          .collection(collections.TIMETABLE_COLLECTION)
          .aggregate([
            {
              $match: {
                $or: [
                  { period1: { $regex: `^${teacherId}\\|` } },
                  { period2: { $regex: `^${teacherId}\\|` } },
                  { period3: { $regex: `^${teacherId}\\|` } },
                  { period4: { $regex: `^${teacherId}\\|` } },
                  { period5: { $regex: `^${teacherId}\\|` } },
                  { period6: { $regex: `^${teacherId}\\|` } }
                ]
              }
            },
            {
              $project: {
                className: "$class",
                subjects: [
                  { $arrayElemAt: [{ $split: ["$period1", "|"] }, 1] },
                  { $arrayElemAt: [{ $split: ["$period2", "|"] }, 1] },
                  { $arrayElemAt: [{ $split: ["$period3", "|"] }, 1] },
                  { $arrayElemAt: [{ $split: ["$period4", "|"] }, 1] },
                  { $arrayElemAt: [{ $split: ["$period5", "|"] }, 1] },
                  { $arrayElemAt: [{ $split: ["$period6", "|"] }, 1] }
                ]
              }
            },
            {
              $unwind: "$subjects"
            },
            {
              $match: {
                subjects: { $ne: null } // Remove empty subjects
              }
            },
            {
              $group: {
                _id: "$className",
                subjects: { $addToSet: "$subjects" }
              }
            },
            {
              $project: {
                _id: 0,
                className: "$_id",
                subjects: 1
              }
            }
          ])
          .toArray();
          console.log(JSON.stringify(timetables),"subbbbbbbbbbbbb")
        resolve(timetables);
      } catch (err) {
        reject(err);
      }
    });
  },  

  ///////ADD material/////////////////////                                         
  addmaterial: (material, teacherId, callback) => {
    if (!teacherId || !objectId.isValid(teacherId)) {
      return callback(null, new Error("Invalid or missing teacherId"));
    }

    material.Price = parseInt(material.Price);
    material.teacherId = objectId(teacherId); // Associate material with the teacher

    db.get()
      .collection(collections.MATERIAL_COLLECTION)
      .insertOne(material)
      .then((data) => {
        callback(data.ops[0]._id); // Return the inserted material ID
      })
      .catch((error) => {
        callback(null, error);
      });
  },


  ///////GET ALL material/////////////////////                                            
  getAllmaterials: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      let materials = await db
        .get()
        .collection(collections.MATERIAL_COLLECTION)
        .find({ teacherId: objectId(teacherId) }) // Filter by teacherId
        .toArray();
      resolve(materials);
    });
  },

  ///////ADD material DETAILS/////////////////////                                            
  getmaterialDetails: (materialId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.MATERIAL_COLLECTION)
        .findOne({
          _id: objectId(materialId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE material/////////////////////                                            
  deletematerial: (materialId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.MATERIAL_COLLECTION)
        .removeOne({
          _id: objectId(materialId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE material/////////////////////                                            
  updatematerial: (materialId, materialDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.MATERIAL_COLLECTION)
        .updateOne(
          {
            _id: objectId(materialId)
          },
          {
            $set: {
              wname: materialDetails.wname,
              seat: materialDetails.seat,
              Price: materialDetails.Price,
              format: materialDetails.format,
              desc: materialDetails.desc,
              baddress: materialDetails.baddress,

            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL material/////////////////////                                            
  deleteAllmaterials: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.MATERIAL_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    db.get()
      .collection(collections.PRODUCTS_COLLECTION)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
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

  dosignup: (teacherData) => {
    return new Promise(async (resolve, reject) => {
      try {
        teacherData.Password = await bcrypt.hash(teacherData.Password, 10);
        teacherData.approved = false; // Set approved to false initially
        const data = await db.get().collection(collections.TEACHER_COLLECTION).insertOne(teacherData);
        resolve(data.ops[0]);
      } catch (error) {
        reject(error);
      }
    });
  },


  doSignin: (teacherData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let teacher = await db
        .get()
        .collection(collections.TEACHER_COLLECTION)
        .findOne({ Email: teacherData.Email });
      if (teacher) {
        if (teacher.rejected) {
          console.log("User is rejected");
          resolve({ status: "rejected" });
        } else {
          bcrypt.compare(teacherData.Password, teacher.Password).then((status) => {
            if (status) {
              if (teacher.approved) {
                console.log("Login Success");
                response.teacher = teacher;
                response.status = true;
              } else {
                console.log("User not approved");
                response.status = "pending";
              }
              resolve(response);
            } else {
              console.log("Login Failed - Incorrect Password");
              resolve({ status: false });
            }
          });
        }
      } else {
        console.log("Login Failed - Email not found");
        resolve({ status: false });
      }
    });
  },


  getProductDetails: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .findOne({ _id: objectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .removeOne({ _id: objectId(productId) })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .updateOne(
          { _id: objectId(productId) },
          {
            $set: {
              Name: productDetails.Name,
              Category: productDetails.Category,
              Price: productDetails.Price,
              Description: productDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCTS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collections.USERS_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  removeUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .removeOne({ _id: objectId(userId) })
        .then(() => {
          resolve();
        });
    });
  },

  removeAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USERS_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },

  getAllOrders: (teacherId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collections.ORDER_COLLECTION)
          .find({ "teacherId": objectId(teacherId) }) // Filter by teacher ID
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatus: (status, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              "status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  cancelOrder: async (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch the order to get the associated material ID
        const order = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });

        if (!order) {
          return reject(new Error("Order not found."));
        }

        const materialId = order.material._id; // Get the material ID from the order

        // Remove the order from the database
        await db.get()
          .collection(collections.ORDER_COLLECTION)
          .deleteOne({ _id: objectId(orderId) });

        // Get the current seat count from the material
        const materialDoc = await db.get()
          .collection(collections.MATERIAL_COLLECTION)
          .findOne({ _id: objectId(materialId) });

        // Check if the seat field exists and is a string
        if (materialDoc && materialDoc.seat) {
          let seatCount = Number(materialDoc.seat); // Convert seat count from string to number

          // Check if the seatCount is a valid number
          if (!isNaN(seatCount)) {
            seatCount += 1; // Increment the seat count

            // Convert back to string and update the material seat count
            await db.get()
              .collection(collections.MATERIAL_COLLECTION)
              .updateOne(
                { _id: objectId(materialId) },
                { $set: { seat: seatCount.toString() } } // Convert number back to string
              );

            resolve(); // Successfully updated the seat count
          } else {
            return reject(new Error("Seat count is not a valid number."));
          }
        } else {
          return reject(new Error("Material not found or seat field is missing."));
        }
      } catch (error) {
        console.error("Error canceling order:", error);
        reject(error);
      }
    });
  },


  cancelAllOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .remove({})
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
