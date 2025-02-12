import { firestore } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import type { User } from "./types";

const usersCollection = "Users";

export const insertUser = async (user: User) => {
  await setDoc(doc(firestore, usersCollection, user.id), user);
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(firestore, usersCollection, userId));
  return docSnap.exists() ? (docSnap.data() as User) : null;
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
