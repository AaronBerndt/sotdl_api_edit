import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection, updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";

const cors = microCors();

type CurrentAffliction = {
  name: string;
};

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { action, temporaryEffect, _id } = request.body;

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { temporaryEffects, ...characterStateRest },
      ...rest
    } = characterData;

    const newTemporaryEffectsList =
      action === "add"
        ? [...temporaryEffects, temporaryEffect]
        : temporaryEffects.filter(
            (temporaryEffectName: string) =>
              temporaryEffectName === temporaryEffects
          );

    const newCharacterData = {
      ...rest,
      characterState: {
        temporaryEffects: newTemporaryEffectsList,
        ...characterStateRest,
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
