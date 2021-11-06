import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection, updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";

export type Expend = {
  name: string;
};

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { _id, days } = request.body.data;

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { overrides, damage },
      ...rest
    } = characterData;

    const { health } = rest;

    const healingRate = Math.floor(health / 4);
    const healingAmount = healingRate * days;

    const newCharacterData = {
      ...rest,
      characterState: {
        afflictions: [],
        damage: damage - healingAmount <= 0 ? 0 : damage - healingAmount,
        expended: [],
        overrides,
      },
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
