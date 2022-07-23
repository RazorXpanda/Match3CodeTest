// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Tile from "./Tile";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    gridParent: cc.Node = null;

    @property([cc.SpriteFrame])
    sprites: Array<cc.SpriteFrame> = [];

    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;

    @property (Number)
    gridDimension: number = null;

    @property (Number)
    distance: number = null;

    @property (cc.Label)
    scoreLabel: cc.Label;

    private grid: cc.Node[][] = [];

    private _score: number = 0;

    public get score() : number {
        return this._score;
    }

    public set score(value: number)
    {
        this._score = value;
        this.scoreLabel.string = this._score.toString();
    }

    // Singleton (I know its bad but i dont have time uwu)
    private static instance: BoardManager;

    public static get Instance(){
        return this.instance
    }
    
    start()
    {
        this.score = 0;
    }

    onLoad()
    {
        BoardManager.instance = this;
        this.grid = [...Array(this.gridDimension)].map(e => Array(this.gridDimension));
        this.InitGrid();
    }

    protected InitGrid()
    {
        const lol =  new cc.Vec3((this.gridDimension * this.distance / 2.0), this.gridDimension * this.distance / 2.0, 0);
        let positionOffset = this.node.position.sub(lol);

        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let col = 0; col < this.gridDimension; col++)
            {
                let possibleSprites = [];

                // slice(0) essentially copies the entire array into possibleSprites empty array
                if (possibleSprites != null && possibleSprites.length < this.sprites.length)
                {
                    possibleSprites = this.sprites.slice(0);
                }

                //Choose what sprite to use for this cell
                let left1 = this.GetSpriteFrameAt(col - 1, row);
                let left2 = this.GetSpriteFrameAt(col - 2, row);

                // if two left sprite frames are the same
                // we remove the sprite frame from the array, so it spawns without instantly gaining points
                if (left2 != null && left1 == left2) // 3
                {
                    const index = possibleSprites.indexOf(left1);
                    if (index > -1)
                    {
                        let removed = possibleSprites.splice(index, 1);
                    }
                }

                let down1 = this.GetSpriteFrameAt(col, row - 1);
                let down2 = this.GetSpriteFrameAt(col, row - 2);

                // if two bottom sprite frames are the same
                // we remove the sprite frame from the array, so it spawns without instantly gaining points
                if (down2 != null && down1 == down2)
                {
                    const index = possibleSprites.indexOf(down1);
                    if (index > -1)
                    {
                        let removed = possibleSprites.splice(index, 1);
                    }
                }  

                // Init set up of tile prefab in grid
                // I instantiated the tile Prefab, assigned a random sprite into the spriteFrame property
                // And then add the Tile script onto it
                // Lastly set the parent to the grid.parent object
                let newTile = cc.instantiate(this.tilePrefab);
                let tileSprite = newTile.getComponent(cc.Sprite);
                tileSprite.spriteFrame = possibleSprites[this.getRandomInt(0, possibleSprites.length)];
                tileSprite.node.addComponent(Tile);
                newTile.setParent(this.gridParent);

                newTile.position = new cc.Vec3(col * this.distance, row * this.distance, 0).add(positionOffset);

                //Assigns it to the grid
                this.grid[col][row] = newTile;    
            }
        }
    }

    private GetSpriteFrameAt(column: number, row: number)
    {
        if (column < 0 || column >= this.gridDimension || row < 0 || row >= this.gridDimension)
            return null;
        let tile = this.grid[column][row];
        let spriteframe = tile.getComponent(cc.Sprite).spriteFrame;
        return spriteframe;
    }

    private GetSpriteObjectAt(column: number, row: number)
    {
        if (column < 0 || column >= this.gridDimension || row < 0 || row >= this.gridDimension)
            return null;
        let node = this.grid[column][row];
        return node;
    }

    private CheckMatch(): boolean
    {
        let matchedTiles: Array<cc.Node> = [];
        let tempArray: Array<cc.Node> = [];
        let gridArray: number[][] = [];
        let gridArray_temp: number[][] = [];

        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let column = 0; column < this.gridDimension; column++)
            {
                let current: cc.Node = this.GetSpriteObjectAt(column, row);

                let horizontalMatches: Array<cc.Node> = this.FindColumnMatchForTile(column, row, current.getComponent(cc.Sprite).spriteFrame);
                let horizontalGridValues: number[][] = this.FindColumnMatchForTile_Grid(column, row, current.getComponent(cc.Sprite).spriteFrame);

                //cc.log(horizontalMatches);
                if (horizontalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(horizontalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;

                    gridArray_temp = gridArray.concat(horizontalGridValues);
                    gridArray_temp.push([column, row])
                    gridArray = gridArray_temp

                    this.score += 1;
                    tempArray = [];
                    gridArray_temp = [];
                }

                let verticalMatches: Array<cc.Node> = this.FindRowMatchForTile(column, row, current.getComponent(cc.Sprite).spriteFrame);
                let verticalGridValues: number[][] = this.FindRowMatchForTile_Grid(column, row, current.getComponent(cc.Sprite).spriteFrame);
                if (verticalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(verticalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;

                    gridArray_temp = gridArray.concat(verticalGridValues);
                    gridArray_temp.push([column, row])
                    gridArray = gridArray_temp

                    this.score += 1;
                    tempArray = [];
                    gridArray_temp = [];
                }
            }
        }

        cc.log(matchedTiles);
        cc.log(gridArray)

        matchedTiles.forEach(function (item)
        {
            item.destroy();
            //item.getComponent(cc.Sprite).spriteFrame = null;
        })

        for (let counter = 0; counter < gridArray.length; counter++)
        {
            let column = gridArray[counter][0]
            let row = gridArray[counter][1]

            this.grid[column][row] = null
        }

        return matchedTiles.length > 0;
    }

    private FindColumnMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Node> = [];
        for (let i = col + 1; i < this.gridDimension; i++)
        {
            let nextColumn = this.GetSpriteObjectAt(i, row);
            if (nextColumn.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextColumn);

        }
        return result;
    }

    private FindColumnMatchForTile_Grid(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let arr: number[][] = [];
        for (let i = col + 1; i < this.gridDimension; i++)
        {
            let nextColumn = this.GetSpriteObjectAt(i, row);
            if (nextColumn.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            arr.push([i,row])
        }
        cc.log(arr)
        return arr;
    }

    private FindRowMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Node> = [];
        for (let i = row + 1; i < this.gridDimension; i++)
        {
            let nextRow = this.GetSpriteObjectAt(col, i);
            if (nextRow.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextRow);
        }
        return result;
    }

    private FindRowMatchForTile_Grid(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let arr: number[][] = [];
        for (let i = row + 1; i < this.gridDimension; i++)
        {
            let nextRow = this.GetSpriteObjectAt(col, i);
            if (nextRow.getComponent(cc.Sprite).spriteFrame.name != sprite.name)
            {
                break;
            }
            arr.push([col,i])
        }
        cc.log(arr)
        return arr;
    }

    private async FillHoles()
    {
        for (let column = 0; column < this.gridDimension; column++)
        {
            for (let row = 0; row < this.gridDimension; row++)
            {
                if (this.grid[column][row] == null)
                {
                    cc.log("HELLO")
                    // position of null element
                    let rowPosition = (row * 100) - 300
                    let colPosition = (column * 100) - 300
                    let nullPosition = new cc.Vec2(colPosition, rowPosition)

                    // Detects the next available null object
                    for (let nextFill = row; nextFill < this.gridDimension; nextFill ++)
                    {
                        if (this.grid[column][nextFill] != null)
                        {
                            // when next available item is found
                            // grabs that nodes position and move it ot the current position, including modifying the grid
                            
                            // moves the new object to the first null position
                            let newObject = this.GetSpriteObjectAt(column, nextFill)
                            newObject.runAction(cc.moveTo(0.1, nullPosition))
                            await new Promise(f => setTimeout(f, 0));

                            // nulls the current position
                            this.grid[column][nextFill] = null
                            this.grid[column][row] = newObject
                            break;
                        }
                        else
                        {
                            if (nextFill != this.gridDimension - 1) continue;

                            //Final tile
                            let newTile = cc.instantiate(this.tilePrefab);
                            let tileSprite = newTile.getComponent(cc.Sprite);
                            tileSprite.spriteFrame = this.sprites[this.getRandomInt(0, this.sprites.length)];
                            tileSprite.node.addComponent(Tile);
                            newTile.setParent(this.gridParent);
                            newTile.setPosition((column * 100) - 300, 300)

                            newTile.runAction(cc.moveTo(0.1, nullPosition))
                            await new Promise(f => setTimeout(f, 0));

                            this.grid[column][row] = newTile
                            cc.log(this.grid)
                        }
                        

                    }
                }
            }
        }
                    /*
                    let nextObject = this.GetSpriteObjectAt(column, row + 1)
                    

                    // instantiates a new last tile and set the spriteFrame to it
                    let last = this.GetSpriteObjectAt(column, this.gridDimension - 1)
                    let newTile = cc.instantiate(this.tilePrefab);
                    let tileSprite = newTile.getComponent(cc.Sprite);
                    tileSprite.spriteFrame = this.sprites[this.getRandomInt(0, this.sprites.length)];
                    tileSprite.node.addComponent(Tile);
                    newTile.setParent(this.gridParent);
    
                    newTile.position = new cc.Vec3(column * this.distance, this.gridDimension - 1 * this.distance, 0)

                    nextObject.runAction(cc.moveTo(0.1, currentPosition))
                    this.grid[column][row+1] = null
                
                //cc.log(this.GetSpriteObjectAt(column, row))
                                    /*
                while (this.GetSpriteObjectAt(column, row) == null)
                {

                    cc.log("HELLO")

                    cc.log(row);
                    for (let filler = row; filler < this.gridDimension - 1; filler++)
                    {
                        console.log(column)
                        console.log(filler)

                        //Get the nodes of the current and next empry sprite frame
                        // this operation needs to modify the sprite frame
                        let current = this.GetSpriteObjectAt(column, filler)

                        let current = this.GetSpriteObjectAt(column, filler).getComponent(cc.Sprite).spriteFrame;
                        let next = this.GetSpriteObjectAt(column, filler + 1).getComponent(cc.Sprite).spriteFrame;
                        this.grid[column][filler].getComponent(cc.Sprite).spriteFrame = next;

                    }
                    let last = this.GetSpriteObjectAt(column, this.gridDimension - 1).getComponent(cc.Sprite).spriteFrame;
                    this.grid[column][this.gridDimension-1].getComponent(cc.Sprite).spriteFrame = this.sprites[this.getRandomInt(0, this.sprites.length)]; // 5
                }
                */
    }

    public async SwapTiles(tile1Position: cc.Vec3, tile2Position: cc.Vec3)
    {
        let tile1 = this.grid[(tile1Position.x + 300)/100][(tile1Position.y + 300)/100];
        let sprite1 = tile1.getComponent(cc.Sprite);
        let tile2 = this.grid[(tile2Position.x + 300)/100][(tile2Position.y + 300)/100];
        let sprite2 = tile2.getComponent(cc.Sprite);
        let temp = this.grid[(tile1Position.x + 300)/100][(tile1Position.y + 300)/100];
        this.grid[(tile1Position.x + 300)/100][(tile1Position.y + 300)/100] = this.grid[(tile2Position.x + 300)/100][(tile2Position.y + 300)/100];
        this.grid[(tile2Position.x + 300)/100][(tile2Position.y + 300)/100] = temp;

        // swap nodes and its position from tile 1 and tile 2
        this.swapNodes(tile1, tile2, tile1Position, tile2Position)

        //let tempSprite = sprite1.spriteFrame;
        //sprite1.spriteFrame = sprite2.spriteFrame;
        //sprite2.spriteFrame = tempSprite;

        tile1 = this.grid[(tile1Position.x + 300)/100][(tile1Position.y + 300)/100];
        tile2 = this.grid[(tile2Position.x + 300)/100][(tile2Position.y + 300)/100];

        // needs this delay so both swapNodes action wont multiply together
        // also makes it looks cool though
        await new Promise(f => setTimeout(f, 1000));

        let changesOccurs: boolean = this.CheckMatch();
        if(!changesOccurs)
        {
            // swap nodes and its position from tile 2 and tile 1
            this.swapNodes(tile2, tile1, tile1Position, tile2Position)

            /*
            let tempSprite = sprite1.spriteFrame;
            sprite1.spriteFrame = sprite2.spriteFrame;
            sprite2.spriteFrame = tempSprite;
            */
        }
        else
        {
            do
            {
                this.FillHoles();
            }
            while (this.CheckMatch());
        }
    }

    private swapNodes(node1: cc.Node, node2: cc.Node, node1Position: cc.Vec3, node2Position: cc.Vec3)
    {
        node1.runAction(cc.moveTo(0.1, node2.getPosition()));
        node2.runAction(cc.moveTo(0.1, node1.getPosition()));

        //let temp = node1;
        //this.grid[(node1Position.x + 300)/100][(node1Position.y + 300)/100] = node2;
        //this.grid[(node2Position.x + 300)/100][(node2Position.y + 300)/100] = temp;
    }

    private moveNode(node1: cc.Node, node2: cc.Node)
    {
        node1.runAction(cc.moveTo(0.1, node2.getPosition()));
    }

    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    private ResetBoard():void
    {
        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let column = 0; column < this.gridDimension; column++)
            {
                this.grid[row][column].getComponent(cc.Sprite).spriteFrame = null;
                this.grid[row][column] = null;
            }
        }
        this.score = 0;
        this.InitGrid();
    }

    public InfoBox(): void
    {
        window.alert("I Love Fruits");
    }
}
