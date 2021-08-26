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

    console.log(request.body);

    const { action, afflictionName, _id } = request.body;

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { afflictions, ...characterStateRest },
      ...rest
    } = characterData;

    const newAfflictionsList =
      action === "add"
        ? [...afflictions, { name: afflictionName }]
        : afflictions.length === 1 || afflictionName === "Fate Success"
        ? afflictions.filter(
            ({ name }: CurrentAffliction) => name !== afflictionName
          )
        : afflictions.splice(
            afflictions.indexOf(
              (currentAffliction: CurrentAffliction) =>
                currentAffliction.name === afflictionName
            ),
            1
          );

    const newCharacterData = {
      ...rest,
      characterState: {
        afflictions: newAfflictionsList,
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
