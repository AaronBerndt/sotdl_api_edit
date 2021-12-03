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

    const { _id, days, healingRate, health } = request.body.data;

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { overrides, damage, ...characterStateRest },
      ...rest
    } = characterData;

    const healingAmount = healingRate * days;

    const newDamage =
      damage + healingAmount > health
        ? health
        : damage + healingAmount < 0
        ? 0
        : damage + healingAmount;

    const newCharacterData = {
      ...rest,
      characterState: {
        ...characterStateRest,
        afflictions: [],
        damage: damage - healingAmount <= 0 ? 0 : damage - healingAmount,
        expended: [],
        injured: (health - newDamage) / health <= 0.5,
        overrides,
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });

    response.status(200).send(newCharacterData);
  } catch (e) {
    console.log(e);

    response.status(504).send(e);
  }
};

export default cors(handler);
