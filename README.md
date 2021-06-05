# Pokemon Fan Games Save Hub

https://squonk.fr/pokemon/


## Testing the website locally

- Install http-server with npm: `npm install -g http-server`
- `http-server`

## Pokemon sprites

Pokemon sprites are managed in the [assets] folder. It is composed of three
files:
- `battlers.png` that lists every battler that were used
- `icons.png` that lists every icon of Pokemon that were used
- `spritesheets.json` that tells where are the sprite of every Pokemon

### Adding new sprites

- `cd tools`
- `npm install` if it is the first time to install dependencies
- `node index.js`
    - Pick Spritesheet Compiler
    - The program will try to guess the number of the Pokemon you entered
    - Format of image name should be something like `Pokemon name-Regional Form-Shiny?-Mega?`. Fusions should be registered as `(Pokemon1)+(Pokemon2)`.
    - If you specify a (partial) path to image like `[Pokemon name] [form number]`, the searched paths will be `(pokemon dex number)_(form number)`
    - Anyway it should be pretty intuitive to use


