import BoardManager from '../scripts/BoardManager';

const {ccclass, property} = cc._decorator;

@ccclass
export default class Tile extends cc.Component {

    private static selected: Tile

    @property(cc.Node)
    private sprite: cc.Node = null;
    
    onLoad()
    {
        this.node.on(cc.Node.EventType.TOUCH_START, this._touchTile, this);
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_END);
    }
    
    start()
    {
        this.sprite = this.node;
    }

    public Select()
    {
        //127.5, 127.5, 127.5 is color gray
        this.sprite.color = new cc.Color(127.5, 127.5, 127.5);
    }

    public Unselect()
    {
        //255, 255, 255 is color white
        this.sprite.color = new cc.Color(255,255,255);
    }

    private GetDistance(tile1Pos: cc.Vec3, tile2Pos: cc.Vec3, tolerance: Number)
    {
        return Math.abs((tile1Pos.x - tile2Pos.x) + (tile1Pos.y - tile2Pos.y)) == tolerance ? true : false;
    }    

    private _touchTile(event?: cc.Event.EventTouch)
    {
        //not used for now
        const touchpoint = new cc.Vec2(event.getLocationX(), event.getLocationY());

        if (Tile.selected != null)
        {
            if (Tile.selected == this) return;
            Tile.selected.Unselect();
            if (this.GetDistance(Tile.selected.node.position, this.node.position, BoardManager.Instance.distance))
            {
                BoardManager.Instance.SwapTiles(this.node.position, Tile.selected.node.position);
                Tile.selected = null;
            }
            else
            {
                Tile.selected = this;
                this.Select();
            }
        }
        else 
        {
            Tile.selected = this;
            this.Select();
        }
            
        }
}
