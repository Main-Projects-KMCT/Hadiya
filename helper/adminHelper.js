var db = require("../config/connection");
var collections = require("../config/collections");
var bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const { ObjectId } = require('mongodb'); // Import ObjectId for MongoDB

module.exports = {

  ///////ADD teacher/////////////////////                                         
  addnotification: (notification, callback) => {
    console.log(notification);

    // Convert userId to ObjectId if it's present
    if (notification.userId) {
      notification.userId = new objectId(notification.userId);
    }

    // Add createdAt field with the current timestamp
    notification.createdAt = new Date();

    db.get()
      .collection(collections.NOTIFICATIONS_COLLECTION)
      .insertOne(notification)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      })
      .catch((err) => {
        console.error("Error inserting notification:", err);
        callback(null);  // Handle error case by passing null
      });
  },


  ///////GET ALL Notifications/////////////////////                                            
  getAllnotifications: () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Fetch all notifications and join with users collection to get Fname
        let notifications = await db
          .get()
          .collection(collections.NOTIFICATIONS_COLLECTION)
          .aggregate([
            {
              $lookup: {
                from: collections.USERS_COLLECTION,  // Name of the users collection
                localField: "userId",  // Field in notifications collection (userId)
                foreignField: "_id",  // Field in users collection (_id)
                as: "userDetails",  // Name of the array where user data will be stored
              },
            },
            {
              $unwind: {
                path: "$userDetails",  // Flatten the userDetails array
                preserveNullAndEmptyArrays: true,  // If user not found, keep notification
              },
            },
          ])
          .toArray();

        // Map over the notifications and add user first name (Fname)
        notifications = notifications.map(notification => ({
          ...notification,
          userFname: notification.userDetails ? notification.userDetails.Fname : 'Unknown',  // Fname of user or 'Unknown' if no user found
        }));

        resolve(notifications);
      } catch (err) {
        reject(err);
      }
    });
  },

  deletenotification: (notificationId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.NOTIFICATIONS_COLLECTION)
        .removeOne({
          _id: objectId(notificationId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },


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

  ///////ADD teacher/////////////////////                                         
  addteacher: (teacher, callback) => {
    console.log(teacher);
    teacher.Price = parseInt(teacher.Price);
    db.get()
      .collection(collections.TEACHER_COLLECTION)
      .insertOne(teacher)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },

  ///////GET ALL teacher/////////////////////                                            
  getAllteachers: () => {
    return new Promise(async (resolve, reject) => {
      let teachers = await db
        .get()
        .collection(collections.TEACHER_COLLECTION)
        .find()
        .toArray();
      resolve(teachers);
    });
  },

  ///////ADD teacher DETAILS/////////////////////                                            
  getteacherDetails: (teacherId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TEACHER_COLLECTION)
        .findOne({
          _id: objectId(teacherId)
        })
        .then((response) => {
          resolve(response);
        });
    });
  },

  ///////DELETE teacher/////////////////////                                            
  deleteteacher: (teacherId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TEACHER_COLLECTION)
        .removeOne({
          _id: objectId(teacherId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  ///////UPDATE teacher/////////////////////                                            
  updateteacher: (teacherId, teacherDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TEACHER_COLLECTION)
        .updateOne(
          {
            _id: objectId(teacherId)
          },
          {
            $set: {
              Name: teacherDetails.Name,
              Category: teacherDetails.Category,
              Price: teacherDetails.Price,
              Description: teacherDetails.Description,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },


  ///////DELETE ALL teacher/////////////////////                                            
  deleteAllteachers: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TEACHER_COLLECTION)
        .remove({})
        .then(() => {
          resolve();
        });
    });
  },


  addProduct: (product, callback) => {
    console.log(product);
    product.Price = parseInt(product.Price);
    product.createdAt = new Date();

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

  doSignup: (adminData) => {
    return new Promise(async (resolve, reject) => {
      if (adminData.Code == "admin123") {
        adminData.Password = await bcrypt.hash(adminData.Password, 10);
        db.get()
          .collection(collections.ADMIN_COLLECTION)
          .insertOne(adminData)
          .then((data) => {
            resolve(data.ops[0]);
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  doSignin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let admin = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ Email: adminData.Email });
      if (admin) {
        bcrypt.compare(adminData.Password, admin.Password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login Failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("Login Failed");
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
      try {
        const users = await db
          .get()
          .collection(collections.USERS_COLLECTION)
          .find()
          .sort({ createdAt: -1 })  // Sort by createdAt in descending order
          .toArray();

        resolve(users);
      } catch (err) {
        reject(err);  // Handle any error during fetching
      }
    });
  },




  getAllTleaves: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const tleaves = await db
          .get()
          .collection(collections.TLEAVE_COLLECTION)
          .find()
          .toArray();

        resolve(tleaves);
      } catch (err) {
        reject(err);  // Handle any error during fetching
      }
    });
  },



  getAllSleaves: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const sleaves = await db
          .get()
          .collection(collections.LEAVE_COLLECTION)
          .find()
          .toArray();

        resolve(sleaves);
      } catch (err) {
        reject(err);  // Handle any error during fetching
      }
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

  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        // Convert the userId to ObjectId if it's not already
        const objectId = new ObjectId(userId);

        // Use updateOne to set isDisable to true
        db.get().collection(collections.USERS_COLLECTION).updateOne(
          { _id: objectId }, // Find user by ObjectId
          { $set: { isDisable: true } }, // Set the isDisable field to true
          (err, result) => {
            if (err) {
              reject(err); // Reject if there's an error
            } else {
              resolve(result); // Resolve if the update is successful
            }
          }
        );
      } catch (err) {
        reject(err); // Catch any error in case of an invalid ObjectId format
      }
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

  getAllOrders: (fromDate, toDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        let query = {};

        // If fromDate and toDate are provided, filter orders by the date range
        if (fromDate && toDate) {
          // Add one day to toDate and set it to midnight
          const adjustedToDate = new Date(toDate);
          adjustedToDate.setDate(adjustedToDate.getDate() + 1);

          query = {
            date: {
              $gte: new Date(fromDate), // Orders from the start date
              $lt: adjustedToDate       // Orders up to the end of the toDate
            }
          };
        }

        let orders = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .find(query)
          .toArray();

        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },


  getOrdersByDateRange: (fromDate, toDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await db.get()
          .collection(collections.ORDER_COLLECTION)
          .find({
            createdAt: {
              $gte: new Date(fromDate), // Greater than or equal to the fromDate
              $lte: new Date(toDate)    // Less than or equal to the toDate
            }
          })
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
              "orderObject.status": status,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },



  changeStatusLeave: (status, tleaveId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.TLEAVE_COLLECTION)
        .updateOne(
          { _id: objectId(tleaveId) },
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



  changeStatusLeaveS: (status, sleaveId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.LEAVE_COLLECTION)
        .updateOne(
          { _id: objectId(sleaveId) },
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


  cancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .removeOne({ _id: objectId(orderId) })
        .then(() => {
          resolve();
        });
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

  /////////////////////////////////////////////////

  ///////GET ALL subject/////////////////////                                            
  getAllSubjects: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let subjects = await db
          .get()
          .collection(collections.SUBJECT_COLLECTION)
          .aggregate([
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION, // ✅ Correct teachers collection name
                localField: "teacher", // ✅ Field in SUBJECT_COLLECTION (Assuming teacher ID is stored here)
                foreignField: "_id", // ✅ Matching field in TEACHER_COLLECTION (ObjectId)
                as: "teacherInfo", // ✅ Output array field
              },
            },
            {
              $unwind: {
                path: "$teacherInfo",
                preserveNullAndEmptyArrays: true, // ✅ Keeps subjects without assigned teachers
              },
            },
            {
              $project: {
                _id: 1, // ✅ Keep subject ID
                sname: 1, // ✅ Keep subject name
                scode: 1, // ✅ Add any other subject details
                teacher: "$teacherInfo.Name", // ✅ Replace teacher ID with name
              },
            },
          ])
          .toArray();
        resolve(subjects);
      } catch (error) {
        reject(error);
      }
    });
  },

  ///////ADD subject/////////////////////                                         
  addSubject: (subject, callback) => {
    console.log(subject);

    // Convert teacher ID to ObjectId
    if (subject.teacher) {
      subject.teacher = new ObjectId(subject.teacher);
    }

    db.get()
      .collection(collections.SUBJECT_COLLECTION)
      .insertOne(subject)
      .then((data) => {
        console.log("Subject added:", data);

        const subjectId = data.insertedId; // ✅ Get the inserted subject ID

        // ✅ Update the teacher document with the latest subject (replace previous one)
        if (subject.teacher) {
          db.get()
            .collection(collections.TEACHER_COLLECTION)
            .updateOne(
              { _id: subject.teacher }, // ✅ Find teacher by ID
              { $set: { subject: subjectId } } // ✅ Replace the `subject` field
            )
            .then(() => {
              console.log(`Subject ID ${subjectId} set for Teacher ID ${subject.teacher}`);
            })
            .catch((err) => console.error("Error updating teacher:", err));
        }

        callback(subjectId);
      })
      .catch((err) => console.error("Error inserting subject:", err));
  },



  ///////GET ALL timetable/////////////////////                                            
  getAllTimetables: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let timetables = await db
          .get()
          .collection(collections.TIMETABLE_COLLECTION)
          .aggregate([
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher1", // Matching teacher1 field
                foreignField: "_id",
                as: "teacherInfo1", // Teacher info for teacher1
              },
            },
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher2", // Matching teacher2 field
                foreignField: "_id",
                as: "teacherInfo2", // Teacher info for teacher2
              },
            },
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher3", // Matching teacher3 field
                foreignField: "_id",
                as: "teacherInfo3", // Teacher info for teacher3
              },
            },
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher4", // Matching teacher4 field
                foreignField: "_id",
                as: "teacherInfo4", // Teacher info for teacher4
              },
            },
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher5", // Matching teacher5 field
                foreignField: "_id",
                as: "teacherInfo5", // Teacher info for teacher5
              },
            },
            {
              $lookup: {
                from: collections.TEACHER_COLLECTION,
                localField: "teacher6", // Matching teacher6 field
                foreignField: "_id",
                as: "teacherInfo6", // Teacher info for teacher6
              },
            },
            {
              $project: {
                _id: 1,
                sname: 1,
                scode: 1,
                day: 1,
                teacher1: { $arrayElemAt: ["$teacherInfo1.Name", 0] }, // Get teacher1's name
                teacher2: { $arrayElemAt: ["$teacherInfo2.Name", 0] }, // Get teacher2's name
                teacher3: { $arrayElemAt: ["$teacherInfo3.Name", 0] }, // Get teacher3's name
                teacher4: { $arrayElemAt: ["$teacherInfo4.Name", 0] }, // Get teacher4's name
                teacher5: { $arrayElemAt: ["$teacherInfo5.Name", 0] }, // Get teacher5's name
                teacher6: { $arrayElemAt: ["$teacherInfo6.Name", 0] }, // Get teacher6's name
              },
            },
          ])
          .toArray();

        resolve(timetables);
      } catch (error) {
        reject(error);
      }
    });
  },


  ///////ADD timetable/////////////////////                                         
  addTimetable: (timetable, callback) => {
    console.log(timetable);

    // Convert teacher IDs to ObjectId
    for (let i = 1; i <= 6; i++) {
      if (timetable[`teacher${i}`]) {
        timetable[`teacher${i}`] = new ObjectId(timetable[`teacher${i}`]);
      }
    }

    db.get()
      .collection(collections.TIMETABLE_COLLECTION)
      .insertOne(timetable)
      .then((data) => {
        console.log("Timetable added:", data);

        const timetableId = data.insertedId; // ✅ Get the inserted timetable ID

        // ✅ Update the teacher documents with the latest timetable
        for (let i = 1; i <= 6; i++) {
          if (timetable[`teacher${i}`]) {
            db.get()
              .collection(collections.TEACHER_COLLECTION)
              .updateOne(
                { _id: timetable[`teacher${i}`] }, // ✅ Find teacher by ID
                { $set: { timetable: timetableId } } // ✅ Replace the timetable field
              )
              .then(() => {
                console.log(`Timetable ID ${timetableId} set for Teacher ${timetable[`teacher${i}`]}`);
              })
              .catch((err) => console.error("Error updating teacher:", err));
          }
        }

        callback(timetableId);
      })
      .catch((err) => console.error("Error inserting timetable:", err));
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
  }



};
