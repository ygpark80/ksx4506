import Vorpal from "vorpal"
import { commands } from "./commands"

const vorpal = new Vorpal().delimiter("ksx4506~$")

export async function run() {
    vorpal.show()
    vorpal.use(commands)
}
