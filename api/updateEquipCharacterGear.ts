import { VercelRequest, VercelResponse } from "@vercel/node";
import { updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import axios from "axios";
import { ObjectId } from "mongodb";

export type Item = {
  id: number;
  name: string;
  description: string;
  itemType: "basic" | "weapon" | "armor";
  price: string;
  availability: string;
};

export type Weapon = Item & {
  damage: string;
  hands: 1 | 2;
  properties: string[];
  type: string;
  requirement: number;
  equiped: boolean;
};

export type Armor = Item & {
  value: number;
  type: string;
  equiped: boolean;
  requirement: number;
  properties: string[];
};

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { itemToEdit, _id } = request.body;

    const { data: character } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${_id}`
    );

    const { items, ...rest } = character;

    const itemType = itemToEdit.itemType === "armor" ? "armor" : "weapons";

    const { [itemType]: itemList, ...itemRest } = items;
    const newItemArray = itemList.map((oldItem: Weapon | Armor) => {
      if (oldItem.id === itemToEdit.id) {
        const { equiped, ...rest } = oldItem;
        return { ...rest, equiped: !equiped };
      } else {
        if (itemType === "armor" && oldItem.equiped) {
          const { equiped, ...rest } = oldItem;
          return { ...rest, equiped: false };
        }
        return oldItem;
      }
    });

    const newCharacterData = {
      items: {
        [itemType]: newItemArray,
        ...itemRest,
      },
      ...rest,
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });

    response.status(200).send(data);
  } catch (e) {
    console.log(e);

    response.status(504).send(e);
  }
};

export default cors(handler);
