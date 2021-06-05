
    function toBase(pkmn) {
        if (families[pkmn] === undefined) {
            return "$" + pkmn;
        } else {
            return families[pkmn];
        }
    }

function makeElementForSprite(spriteUrl) {
    return `<span class="sprite"><img src="icons/${spriteUrl}.png"></span>`;
}

let cachedContent = {
};

let app = new Vue({
    el: "#main",
    data: {
        savefiles: [],
        teams: [],
        speciecount: [],
        counttype: "ind_specie"
    },
    methods: {
        addSavefile: function(savefile) { this.savefiles.push(savefile); },
        addTeam: function(team) { this.teams.push(team); },
        spriteFor: function(pokemon) {
            if (typeof pokemon === 'string') return this.spriteFor({ icon: pokemon });
            return makeElementForSprite(pokemon.icon);
        },

        countChange: function() {
            if (this.counttype === 'ind_form') {
                this.speciecount = cachedContent.forms;
            } else if (this.counttype === 'ind_specie') {
                this.speciecount = cachedContent.families;
            } else {
                this.speciecount = [];
            }
        }
    }
});

// =============================================================================
// =============================================================================
// =============================================================================
// =============================================================================

let spritesheets_json = null;

class Pokemon$ {
    static decompose(name) {
        const isShiny = name.indexOf("-Shiny");
        if (isShiny !== -1) {
            name = name.substr(0, isShiny) + name.substr(isShiny + "-Shiny".length);
        }

        if (name.endsWith("-Mega")) {
            name = name.substr(0, name.length - "-Mega".length);
        } else if (name.endsWith("-MegaX") || name.endsWith("-MegaY")) {
            // Charizard / Mewtwo
            name = name.substr(0, name.length - "-MegaX".length);
        }

        const splitted = Pokemon$.unbreak(name.split("-"));

        if (splitted.length == 1) {
            return [splitted[0], null];
        } else if (splitted.length == 2) {
            return splitted;
        } else {
            console.error(name + " has more than 2 parts");
            return splitted.slice(0, 2);
        }
    }

    static unbreak(splitted) {
        if (splitted.length < 2) return splitted;

        let rebuild = (splitted[0] === "Ho" && splitted[1] === "Oh")
            || (splitted[1] === "o") /* Jangmo-o and relatives (including Epoch Shellos) */;
        
        if (rebuild) {
            return [splitted[0] + "-" + splitted[1], ...splitted.slice(2)];
        } else {
            return splitted;
        }
    }

    static getSpriteCss(spriteName) {
        let dict = spritesheets_json[spriteName];
        if (dict === undefined) {
            console.error(`${spriteName} has no entry`);
        }

        let fields = [
            { name: 'icon'   , perRow: 12 }, 
            { name: 'battler', perRow:  6 }
        ];

        let result = {};

        for (const field of fields) {
            let thisDict = dict[field.name];
            let x =           (thisDict.slot % field.perRow) * spritesheets_json['@spritesize'][field.name];
            let y = Math.floor(thisDict.slot / field.perRow) * spritesheets_json['@spritesize'][field.name];

            result[field.name] = {
                x, y, width: thisDict.width, height: thisDict.height
            };
        }

        result.icon.width = 32;
        result.icon.height = 32;

        return result;
    }

    constructor(dict, game) {
        this.main = dict.main !== false;

        if (spritesheets_json === null) {
            throw Error(
                "A Pokemon$ should not never be instancied"
                + "before spritesheets_json is loaded"
            );
        }

        this.sprites = Pokemon$.getSpriteCss(game + "/" + dict.$);

        if (dict.$.indexOf("+") === -1) {
            // Kyurem-Complete not being counted as a fusion is deliberate
            const [specie, regionalForm] = Pokemon$.decompose(dict.$);
            this.specie = specie;
            this.regionalForm = regionalForm;
            this.components = [specie + (regionalForm === null ? "" : "-" + regionalForm)];
        } else {
            this.specie = dict.$.split("+").join(" / ");
            this.regionalForm = null;
            this.components = dict.$.split("+");
        }
    }

    isMain() { return this.main; }

    toHtmlIcon() {
        let style = "background-position: -" + (this.sprites.icon.x) + "px ";
        style += " -" + (this.sprites.icon.y) + "px;";
        return `<div class="iconSprite" style="${style}"></div>`
    }

    toHtmlBattler() {
        let style = "background-position: -" + (this.sprites.battler.x) + "px ";
        style += " -" + (this.sprites.battler.y) + "px;";
        style += ` width:  ${this.sprites.battler.width}px;  min-width:  ${this.sprites.battler.width}px; `
        style += ` height: ${this.sprites.battler.height}px; min-height: ${this.sprites.battler.height}px; `
        return `<div class="battlerSprite" style="${style}"></div>`
    }

    getAllCurrentForms() { return this.components; }
    getAllBaseForms()    { return this.components.map(x => Pokemon$.decompose(x)[0]).map(toBase); }
}

function newPokemon(dict, game) {
    if (dict.$ !== undefined) return new Pokemon$(dict, game);
    else throw Error("Invalid input");
}

// Populate the list

function populateGames() {

for (let game of games) {
    if (game.history !== undefined) {
        game.version = game.history[0].version + " > " + game.history[game.history.length - 1].version;
        game.date = game.history[0].date + "+";
        game.path = game.history[game.history.length - 1].path;
    }

    const spriteKey = game.sprite_key ? game.sprite_key : game.game;

    let content = {
        team: Object.keys(game.pokemons || {})
                .map(key => new Pokemon$(game.pokemons[key], spriteKey))
                .filter(pokemon => pokemon.isMain())
                .map(pokemon => pokemon.toHtmlIcon())
                .join(''),
        game: game.game,
        date: game.date,
        version: game.version,
        player: game.player
    };

    function add(func) {
        let tdElement = document.createElement("td");
        func(tdElement);
        return tdElement.innerHTML;
    }

    content.savefile = add(tdElement => {
        if (game.path === undefined) {
            tdElement.appendChild(document.createTextNode(game.save_file));
        } else {
            let aElement = document.createElement("a");
            aElement.setAttribute("href", "saves/" + game.path);
            aElement.appendChild(document.createTextNode("Save file"));
            tdElement.appendChild(aElement);
        }
    })

    content.comment = add(tdElement => {
        if (game.comments === undefined) {
            if (game.comments_d === undefined) {
                tdElement.appendChild(document.createTextNode(""));
            } else {
                let first = true;
                for (let d in game.comments_d) {
                    if (!first) {
                        tdElement.appendChild(document.createTextNode(" / "));
                    } else {
                        first = false;
                    }

                    let aElement = document.createElement("a");
                    aElement.setAttribute("href", game.comments_d[d]);
                    aElement.appendChild(document.createTextNode(d));
                    tdElement.appendChild(aElement);
                }
            }
        } else {
            let aElement = document.createElement("a");
            aElement.setAttribute("href", game.comments);
            aElement.appendChild(document.createTextNode("Comments"));
            tdElement.appendChild(aElement);
        }
    })

    app.addSavefile(content);
}


}

// =============================================================================
// =============================================================================
// =============================================================================
// =============================================================================




let count = {};
let countMergedForms = {};

let addOne = (dict, n, icon) => {
    if (dict[n] === undefined) {
        dict[n] = [];
    }
    
    dict[n].push(icon);
};

function addCount(icon, name, form, family, ignore_specie_name) {
    let x = icon;
    icon = {
        toHtmlIcon: function() {
            return makeElementForSprite(x);
        }
    };


    addOne(countMergedForms, toBase(family || name), icon);

    if (form !== undefined) {
        if (ignore_specie_name) {
            name = form;
        } else {
            name = name + " " + form;
        }
    }

    addOne(count, name, icon);
}

function addTeamDict(title, team, game) {
    let party = [];

    for (let pokemonSurname in team) {
        let pkmn = new Pokemon$(team[pokemonSurname], game);

        party.push(pkmn);

        pkmn.getAllBaseForms()
            .forEach(formName => addOne(countMergedForms, formName, pkmn));
        
        pkmn.getAllCurrentForms()
            .forEach(formName => addOne(count           , formName, pkmn));
    }

    // Populates the teams table with an image of every pokemon of the team
    app.addTeam({ title, party })
}

function fillCounts() {

    function _(count) {
        let pokemons = Object.entries(count);

        pokemons.sort((a, b) => {
            if (a[1].length < b[1].length) return 1;
            if (a[1].length > b[1].length) return -1;
            return a[0] > b[0];
        })

        return pokemons.map(pkmn => { return { name: pkmn[0], individuals: pkmn[1] };});
    }

    cachedContent.forms = _(count);
    cachedContent.families = _(countMergedForms);

    app.countChange();
}

function main() {
    populateGames();

    for (const saveFile of games) {
        
        const spriteKey = saveFile.sprite_key ? saveFile.sprite_key : saveFile.game;

        if (saveFile["pokemons"] !== undefined) {
            addTeamDict(
                saveFile["game"] + " - " + saveFile["player"],
                saveFile["pokemons"],
                spriteKey
            );
        }
    }
    
    fillCounts();
}

$.ajax({
    url: 'assets/spritesheets.json',

    success: function(json) {
        spritesheets_json = json;
        main();
    }
});
