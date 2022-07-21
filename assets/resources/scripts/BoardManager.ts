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
                if (possibleSprites != null && possibleSprites.length < this.sprites.length)
                {
                    possibleSprites = this.sprites.slice(0);
                }
                //Choose what sprite to use for this cell
                let left1 = this.GetSpriteAt(col - 1, row); //2
                let left2 = this.GetSpriteAt(col - 2, row);
                //if (left1 != null) cc.log("Sprite at left 1 is " + left1.name)
                //if (left2 != null) cc.log("Sprite at left 2 is " + left2.name)
                if (left2 != null && left1 == left2) // 3
                {
                    const index = possibleSprites.indexOf(left1);
                    //possibleSprites.splice(index); // 4
                    if (index > -1)
                    {
                        possibleSprites.splice
                        let removed = possibleSprites.splice(index, 1);
                    }
                }

                let down1 = this.GetSpriteAt(col, row - 1); // 5
                let down2 = this.GetSpriteAt(col, row - 2);
                //if (down1 != null) cc.log("Sprite at down 1 is " + down1.name)
                //if (down2 != null) cc.log("Sprite at down 2 is " + down2.name)
                if (down2 != null && down1 == down2)
                {
                    const index = possibleSprites.indexOf(down1);
                    if (index > -1)
                    {
                        let removed = possibleSprites.splice(index, 1);
                    }
                }  

                let newTile = cc.instantiate(this.tilePrefab);

                // Get sprite component from tile prefab
                let tileSprite = newTile.getComponent(cc.Sprite);
                tileSprite.spriteFrame = possibleSprites[this.getRandomInt(0, possibleSprites.length)];
                tileSprite.node.addComponent(Tile);

                newTile.setParent(this.gridParent);
                newTile.position = new cc.Vec3(col * this.distance, row * this.distance, 0).add(positionOffset);

                this.grid[col][row] = newTile;    
            }
        }
    }

    private GetSpriteAt(column: number, row: number)
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
        let tile = this.grid[column][row];
        let sprite = tile.getComponent(cc.Sprite);
        return sprite;
    }

    private CheckMatch(): boolean
    {
        let matchedTiles: Array<cc.Sprite> = [];
        let tempArray: Array<cc.Sprite> = [];
        for (let row = 0; row < this.gridDimension; row++)
        {
            for (let column = 0; column < this.gridDimension; column++)
            {
                let current: cc.Sprite = this.GetSpriteObjectAt(column, row);

                let horizontalMatches: Array<cc.Sprite> = this.FindColumnMatchForTile(column, row, current.spriteFrame); // 4
                //cc.log(horizontalMatches);
                if (horizontalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(horizontalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;
                    this.score += 1;
                    tempArray = [];
                }

                let verticalMatches: Array<cc.Sprite> = this.FindRowMatchForTile(column, row, current.spriteFrame); // 6
                if (verticalMatches.length >= 2)
                {
                    tempArray = matchedTiles.concat(verticalMatches);
                    tempArray.push(current);
                    matchedTiles = tempArray;
                    this.score += 1;
                    tempArray = [];
                }
            }
        }

        cc.log(matchedTiles);

        matchedTiles.forEach(function (item)
        {
            item.spriteFrame = null;
        })

        return matchedTiles.length > 0;
    }

    private FillHoles(): void
    {
        for (let column = 0; column < this.gridDimension; column++)
        {
            for (let row = 0; row < this.gridDimension; row++)
            {
                while (this.GetSpriteObjectAt(column, row).spriteFrame == null)
                {
                    cc.log("CALLED");
                    cc.log(row);
                    for (let filler = row; filler < this.gridDimension - 1; filler++)
                    {
                        console.log(column)
                        console.log(filler)
                        let current = this.GetSpriteObjectAt(column, filler).spriteFrame;
                        let next = this.GetSpriteObjectAt(column, filler + 1).spriteFrame;
                        this.grid[column][filler].getComponent(cc.Sprite).spriteFrame = next;
                    }
                    let last = this.GetSpriteObjectAt(column, this.gridDimension - 1).spriteFrame;
                    this.grid[column][this.gridDimension-1].getComponent(cc.Sprite).spriteFrame = this.sprites[this.getRandomInt(0, this.sprites.length)]; // 5
                }
            }
        }
    }

    private FindColumnMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Sprite> = [];
        for (let i = col + 1; i < this.gridDimension; i++)
        {
            let nextColumn = this.GetSpriteObjectAt(i, row);
            if (nextColumn.spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextColumn);
        }
        return result;
    }

    private FindRowMatchForTile(col: number, row: number, sprite: cc.SpriteFrame)
    {
        let result: Array<cc.Sprite> = [];
        for (let i = row + 1; i < this.gridDimension; i++)
        {
            let nextRow = this.GetSpriteObjectAt(col, i);
            if (nextRow.spriteFrame.name != sprite.name)
            {
                break;
            }
            result.push(nextRow);
        }
        return result;
    }
    
    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    public SwapTiles(tile1Position: cc.Vec3, tile2Position: cc.Vec3)
    {
        let tile1 = this.grid[(tile1Position.x + 300)/100][(tile1Position.y + 300)/100];
        let sprite1 = tile1.getComponent(cc.Sprite);

        let tile2 = this.grid[(tile2Position.x+300)/100][(tile2Position.y+300)/100];
        let sprite2 = tile2.getComponent(cc.Sprite);

        let tempSprite = sprite1.spriteFrame;
        sprite1.spriteFrame = sprite2.spriteFrame;
        sprite2.spriteFrame = tempSprite;

        
        let changesOccurs: boolean = this.CheckMatch();
        if(!changesOccurs)
        {
            let tempSprite = sprite1.spriteFrame;
            sprite1.spriteFrame = sprite2.spriteFrame;
            sprite2.spriteFrame = tempSprite;
        }
        else
        {
            this.FillHoles();
            do
            {
                this.FillHoles();
            }
            while (this.CheckMatch());
        }
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
}
