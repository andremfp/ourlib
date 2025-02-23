import { firestore } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import type { User } from "./types";

const usersCollection = "users";

export const insertUser = async (user: User) => {
  await setDoc(doc(firestore, usersCollection, user.id), user);
};

export const removeUser = async (userId: string) => {
  await deleteDoc(doc(firestore, usersCollection, userId));
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(firestore, usersCollection, userId));
  return docSnap.exists() ? (docSnap.data() as User) : null;
};

export const updateUsername = async (userId: string, username: string) => {
  await updateDoc(doc(firestore, usersCollection, userId), { username });
};

export const addFriend = async (userId: string, friendId: string) => {
  await updateDoc(doc(firestore, usersCollection, userId), {
    friends: arrayUnion(friendId),
  });
};

export const removeFriend = async (userId: string, friendId: string) => {
  await updateDoc(doc(firestore, usersCollection, userId), {
    friends: arrayRemove(friendId),
  });
};
