import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  Firestore,
} from "firebase/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
} from "@jest/globals";

const PROJECT_ID = "demo-test";
const FUNCTIONS_URL = "http://127.0.0.1:5001";

describe("Firebase Tests", () => {
  let testEnv: RulesTestEnvironment;
  let unauthedFirestore: Firestore;
  let authedUser1Firestore: Firestore;
  let authedUser2Firestore: Firestore;
  let adminDb: admin.firestore.Firestore;

  beforeAll(async () => {
    // Initialize Admin SDK
    const adminApp = admin.initializeApp({
      projectId: PROJECT_ID,
    });

    adminDb = getFirestore(adminApp);
    adminDb.settings({
      host: "127.0.0.1:8080",
      ssl: false,
    });

    // Wait for emulators to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: "127.0.0.1",
        port: 8080,
      },
    });

    // Set up different auth contexts
    unauthedFirestore = testEnv
      .unauthenticatedContext()
      .firestore() as unknown as Firestore;
    authedUser1Firestore = testEnv
      .authenticatedContext("user1")
      .firestore() as unknown as Firestore;
    authedUser2Firestore = testEnv
      .authenticatedContext("user2")
      .firestore() as unknown as Firestore;
  });

  afterAll(async () => {
    await testEnv.cleanup();
    await admin.app().delete();
  });

  // Firestore Rules Tests
  describe("Firestore Security Rules", () => {
    beforeEach(async () => {
      await testEnv.clearFirestore();
    });

    describe("Users Collection", () => {
      it("should allow anyone to create a user document, but do nothing else", async () => {
        const userRef = doc(unauthedFirestore, "users", "user1");
        await assertSucceeds(
          setDoc(userRef, {
            id: "user1",
            username: "testuser",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            friends: [],
          }),
        );

        await assertFails(getDoc(userRef));
        await assertFails(updateDoc(userRef, { username: "newName" }));
        await assertFails(deleteDoc(userRef));
      });

      it("should allow authenticated users to read/update their own document", async () => {
        const userRef = doc(authedUser1Firestore, "users", "user1");
        await setDoc(userRef, {
          id: "user1",
          username: "user1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          friends: [],
        });

        await assertSucceeds(getDoc(userRef));
        await assertSucceeds(updateDoc(userRef, { username: "updatedUser1" }));
      });

      it("should deny users from reading/updating another user's document", async () => {
        const userRef = doc(authedUser2Firestore, "users", "user1");
        await assertFails(getDoc(userRef));
        await assertFails(updateDoc(userRef, { username: "newName" }));
      });

      it("should allow authenticated user to delete their own user", async () => {
        const userRef = doc(authedUser1Firestore, "users", "user1");
        await setDoc(userRef, {
          id: "user1",
          username: "user1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          friends: [],
        });

        await assertSucceeds(deleteDoc(userRef));
      });

      it("should deny users from deleting another user's document", async () => {
        const userRef = doc(authedUser2Firestore, "users", "user1");
        await assertFails(deleteDoc(userRef));
      });
    });

    describe("Libraries Collection", () => {
      it("should deny unauthenticated users - all actions", async () => {
        const ownerRef = doc(unauthedFirestore, "users", "user1");
        const libraryRef = doc(unauthedFirestore, "libraries", "lib1");
        await assertFails(
          setDoc(libraryRef, {
            id: "lib1",
            name: "My Library",
            owner: ownerRef,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subscribers: [],
          }),
        );

        const authedLibraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(authedLibraryRef, {
          id: "lib1",
          name: "My Library",
          owner: `/databases/${PROJECT_ID}/documents/users/user1`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        await assertFails(getDoc(libraryRef));

        await assertFails(
          updateDoc(libraryRef, {
            name: "Updated Library",
          }),
        );
        await assertFails(
          updateDoc(libraryRef, {
            subscribers: ["user2"],
          }),
        );

        await assertFails(deleteDoc(libraryRef));
      });

      it("should allow authenticated user to create a library", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await assertSucceeds(
          setDoc(libraryRef, {
            id: "lib1",
            name: "My Library",
            owner: ownerRef,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            subscribers: [],
          }),
        );
      });

      it("should allow library owner's friends to read, subscribe, but not update other fields", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        await setDoc(ownerRef, {
          id: "user1",
          username: "user1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          friends: ["user2"],
        });

        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        const friendLibraryRef = doc(authedUser2Firestore, "libraries", "lib1");
        await assertSucceeds(getDoc(friendLibraryRef));

        await assertSucceeds(
          updateDoc(friendLibraryRef, {
            subscribers: ["user2"],
          }),
        );

        await assertFails(
          updateDoc(friendLibraryRef, {
            name: "New Name",
          }),
        );
      });

      it("should allow subscribers to read subscribed libraries, unsubscribe, but not update other fields", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: ["user2"],
        });

        const subscriberLibraryRef = doc(
          authedUser2Firestore,
          "libraries",
          "lib1",
        );
        await assertSucceeds(getDoc(subscriberLibraryRef));

        await assertSucceeds(
          updateDoc(subscriberLibraryRef, {
            subscribers: [],
          }),
        );

        await assertFails(
          updateDoc(subscriberLibraryRef, {
            name: "New Name",
          }),
        );
      });

      it("should deny non-friends/non-owners/non-subscribers from reading or updating a user's libraries", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        const nonFriendOrOwnerLibraryRef = doc(
          authedUser2Firestore,
          "libraries",
          "lib1",
        );
        await assertFails(getDoc(nonFriendOrOwnerLibraryRef));
        await assertFails(
          updateDoc(nonFriendOrOwnerLibraryRef, { subscribers: "user2" }),
        );
        await assertFails(
          updateDoc(nonFriendOrOwnerLibraryRef, { name: "New Name" }),
        );
      });

      it("should allow the owner to read, update and delete her library", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        await assertSucceeds(getDoc(libraryRef));
        await assertSucceeds(updateDoc(libraryRef, { name: "New Name" }));
        await assertSucceeds(updateDoc(libraryRef, { subscribers: ["user2"] }));
        await assertSucceeds(deleteDoc(libraryRef));
      });

      it("should deny non-owners from deleting a library", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        const nonOwnerLibraryRef = doc(
          authedUser2Firestore,
          "libraries",
          "lib1",
        );
        await assertFails(deleteDoc(nonOwnerLibraryRef));
      });
    });

    describe("Books Collection", () => {
      it("should deny unauthenticated users - all actions", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const authedlibraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        setDoc(authedlibraryRef, {
          id: "lib1",
          name: "My Library",
          owner: ownerRef,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subscribers: [],
        });

        const authedBookRef = doc(authedUser1Firestore, "books", "book1");
        await setDoc(authedBookRef, {
          title: "Book 1",
          author: "Author 1",
          library: authedlibraryRef,
        });

        await assertFails(
          setDoc(doc(unauthedFirestore, "books", "book2"), {
            title: "Book 2",
            author: "Author 2",
            library: authedlibraryRef,
          }),
        );

        await assertFails(getDoc(doc(unauthedFirestore, "books", "book1")));

        await assertFails(
          updateDoc(doc(unauthedFirestore, "books", "book1"), {
            title: "New Title",
          }),
        );

        await assertFails(deleteDoc(doc(unauthedFirestore, "books", "book1")));
      });

      it("should deny authenticated users from creating, reading, updating or deleting a book in a library they don't own", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: [],
        });

        const bookRef = doc(authedUser1Firestore, "books", "book1");

        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
        });

        await assertFails(
          setDoc(doc(authedUser2Firestore, "books", "book2"), {
            title: "Book 2",
            author: "Author 2",
            library: libraryRef,
          }),
        );

        await assertFails(getDoc(doc(authedUser2Firestore, "books", "book1")));

        await assertFails(
          updateDoc(doc(authedUser2Firestore, "books", "book1"), {
            title: "New Title",
          }),
        );
      });

      it("should allow library owners to create, read and update a book in their library", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          id: "lib1",
          owner: ownerRef,
          subscribers: [],
        });
        const bookRef = doc(authedUser1Firestore, "books", "book1");
        await assertSucceeds(
          setDoc(bookRef, {
            title: "Book 1",
            author: "Author 1",
            library: libraryRef,
            lentTo: null,
          }),
        );
        await assertSucceeds(getDoc(bookRef));
        await assertSucceeds(
          updateDoc(bookRef, {
            title: "New Title",
          }),
        );
      });

      it("should allow users to read books in libraries they are subscribed to", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: ["user2"],
        });

        const bookRef = doc(authedUser1Firestore, "books", "book1");
        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
        });

        await assertSucceeds(
          getDoc(doc(authedUser2Firestore, "books", "book1")),
        );
      });

      it("should allow borrowers to return a book if it is lent to them, and they are subscribed", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const borrowerRef = doc(authedUser1Firestore, "users", "user2");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: ["user2"],
        });
        const bookRef = doc(collection(authedUser1Firestore, "books"), "book1");
        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
          lentTo: borrowerRef,
        });

        await assertSucceeds(
          updateDoc(doc(authedUser2Firestore, "books", "book1"), {
            lentTo: null,
          }),
        );
      });

      it("should allow library owners to delete books if not lent out", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: [],
        });
        const bookRef = doc(authedUser1Firestore, "books", "book1");
        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
          lentTo: null,
        });
        await assertSucceeds(deleteDoc(bookRef));
      });

      it("should deny library owners from deleting books that are lent out", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const borrowerRef = doc(authedUser1Firestore, "users", "user2");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: [],
        });
        const bookRef = doc(collection(authedUser1Firestore, "books"), "book1");
        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
          lentTo: borrowerRef,
        });
        await assertFails(deleteDoc(bookRef));
      });

      it("should deny users from reading and updating books from a library they are not subscribed to", async () => {
        const ownerRef = doc(authedUser1Firestore, "users", "user1");
        const libraryRef = doc(authedUser1Firestore, "libraries", "lib1");
        await setDoc(libraryRef, {
          owner: ownerRef,
          subscribers: [],
        });
        const bookRef = doc(authedUser1Firestore, "books", "book1");
        await setDoc(bookRef, {
          title: "Book 1",
          author: "Author 1",
          library: libraryRef,
        });

        await assertFails(getDoc(doc(authedUser2Firestore, "books", "book1")));

        await assertFails(
          updateDoc(doc(authedUser2Firestore, "books", "book1"), {
            title: "New Title",
          }),
        );
      });
    });

    describe("Updates Collection", () => {
      it("should deny unauthenticated users - all actions", async () => {
        const updateRef = doc(unauthedFirestore, "updates", "update1");
        await assertFails(
          setDoc(updateRef, {
            title: "Update 1",
            description: "Description 1",
            userId: "user1",
          }),
        );

        const authedUpdateRef = doc(authedUser1Firestore, "updates", "update1");
        await setDoc(authedUpdateRef, {
          title: "Update 1",
          description: "Description 1",
          userId: "user1",
        });

        await assertFails(getDoc(updateRef));
        await assertFails(updateDoc(updateRef, { title: "New Title" }));
        await assertFails(deleteDoc(updateRef));
      });

      it("should allow authenticated users to create, read, update and delete their own update", async () => {
        const updateRef = doc(authedUser1Firestore, "updates", "update1");
        await assertSucceeds(
          setDoc(updateRef, {
            title: "Update 1",
            description: "Description 1",
            userId: "user1",
          }),
        );

        await assertSucceeds(getDoc(updateRef));
        await assertSucceeds(updateDoc(updateRef, { title: "New Title" }));
        await assertSucceeds(deleteDoc(updateRef));
      });

      it("should allow users to read an update if it is visible to them", async () => {
        const updateRef = doc(authedUser1Firestore, "updates", "update1");
        await setDoc(updateRef, {
          title: "Update 1",
          description: "Description 1",
          userId: "user1",
          visibleTo: ["user2"],
        });

        await assertSucceeds(
          getDoc(doc(authedUser2Firestore, "updates", "update1")),
        );
      });

      it("should deny users from reading, updating or deleting an update if it is not visible to them", async () => {
        const updateRef = doc(authedUser1Firestore, "updates", "update1");
        await setDoc(updateRef, {
          title: "Update 1",
          description: "Description 1",
          userId: "user1",
          visibleTo: [],
        });

        await assertFails(
          getDoc(doc(authedUser2Firestore, "updates", "update1")),
        );
        await assertFails(
          updateDoc(doc(authedUser2Firestore, "updates", "update1"), {
            title: "New Title",
          }),
        );
        await assertFails(
          deleteDoc(doc(authedUser2Firestore, "updates", "update1")),
        );
      });

      it("should deny users from reading, updating or deleting an update if it is not owned by them", async () => {
        const updateRef = doc(authedUser1Firestore, "updates", "update1");
        await setDoc(updateRef, {
          title: "Update 1",
          description: "Description 1",
          userId: "user1",
        });

        await assertFails(
          getDoc(doc(authedUser2Firestore, "updates", "update1")),
        );
        await assertFails(
          updateDoc(doc(authedUser2Firestore, "updates", "update1"), {
            title: "New Title",
          }),
        );
        await assertFails(
          deleteDoc(doc(authedUser2Firestore, "updates", "update1")),
        );
      });

      it("should deny users from creating updates for other users", async () => {
        const updateRef = doc(authedUser1Firestore, "updates", "update1");
        await assertFails(
          setDoc(updateRef, {
            title: "Update 1",
            description: "Description 1",
            userId: "user2",
          }),
        );
      });
    });
  });

  // HTTP Functions Tests
  describe("HTTP Functions", () => {
    beforeAll(async () => {
      // Clean up before each test
      await testEnv.clearFirestore();

      const now = new Date();
      const updatesRef = adminDb.collection("updates");

      // Add test updates
      const testUpdates = [
        {
          content: "Old Update 1",
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          ),
        }, // 40 days ago
        {
          content: "Old Update 2",
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
          ),
        }, // 35 days ago
        {
          content: "Recent Update",
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          ),
        }, // 10 days ago
      ];

      // Use Promise.all to wait for all writes to complete
      await Promise.all(testUpdates.map((update) => updatesRef.add(update)));
      console.log("Seeded Firestore with test updates.");
    });

    it("should call manualCleanup function and delete old updates", async () => {
      // Get initial count
      const beforeSnapshot = await adminDb.collection("updates").get();
      const initialCount = beforeSnapshot.size;
      console.log(`Initial document count: ${initialCount}`);

      // Call the cleanup function
      const response = await fetch(
        `${FUNCTIONS_URL}/${PROJECT_ID}/europe-west1/manualCleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(response.status).toBe(200);

      // Wait for function to complete (increase timeout if needed)
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Get final count
      const afterSnapshot = await adminDb.collection("updates").get();
      const finalCount = afterSnapshot.size;
      console.log(`Final document count: ${finalCount}`);

      // We expect 2 documents to be deleted (the ones older than 30 days)
      expect(finalCount).toBe(initialCount - 2);

      // Verify the remaining document is the recent one
      const remainingDocs = afterSnapshot.docs.map((doc) => doc.data());
      expect(remainingDocs.length).toBe(1);
      expect(remainingDocs[0].content).toBe("Recent Update");
    }, 10000); // Increase test timeout to 10 seconds
  });
});
