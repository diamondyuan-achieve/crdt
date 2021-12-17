import { Tree, treeToString } from "./debug";
import { Clock, Ordering } from "./clock";

enum Action {
  AddLeaf,
  Move,
}

interface AddLeaf {
  type: Action.AddLeaf;
  parentId: Clock | null;
  leftId: Clock | null;
  id: Clock;
  value: string;
}

interface Move {
  type: Action.Move;
  from: Clock;
  targetParent: Clock | null;
  targetLeftId: Clock | null;
  id: Clock;
}

type Event = AddLeaf | Move;

function searchIndex(events: Event[], target: Event) {
  if (events.length === 0) {
    return 0;
  }
  let left = 0;
  let right = events.length - 1;
  if (target.id.compare(events[right].id) === Ordering.Greater) {
    return right + 1;
  }
  while (left < right) {
    let index = parseInt(((left + right) >>> 1) as any); //todo fix me
    if (events[index].id.compare(target.id) === Ordering.Less) {
      left = index + 1;
    } else {
      right = index;
    }
  }
  return left;
}

export class OrderTree {
  //记录子节点
  private children: Map<Clock | null, Clock[]>;
  //记录当前的 value
  private value: Map<Clock | null, string>;
  //记录节点当前所在的位置
  private currentId: Map<Clock, Clock>;

  /**
   * local logic clock
   */
  private clock: Clock;

  private logs: Event[];
  private logMap: Map<Clock, Event>;

  constructor(name: string) {
    this.clock = new Clock(name);
    this.children = new Map<Clock, Clock[]>();
    this.value = new Map();
    this.currentId = new Map();
    this.logs = [];
    this.logMap = new Map();
  }

  /**
   *
   * @param parents 先根据 parents 找到子节点的数组
   * @param offset 需要添加到第 offset 的右边，如果是 null、就放到头部
   * @param value 叶子结点的数值
   * @returns 事件序列
   */
  addLeaf(parents: number[], offset: number | null, value: string): Event {
    const target = this.getByPath({ parents, offset });
    const action: AddLeaf = {
      type: Action.AddLeaf,
      id: this.clock.tick(),
      parentId: target.parentId,
      leftId: target.id,
      value,
    };
    this.applyEvent(action);
    return action;
  }

  private getByOffset(clocks: Clock[], offset: number) {
    return clocks.map((o) => this.getRealId(o)).filter((o) => !!o)[offset];
  }

  /**
   *
   * @param id 当前的 id
   * @returns 原始的 id
   */
  private getRealId(id: Clock): Clock | null {
    //如果在 currentId，说明当前节点已经被移走了
    if (this.currentId.has(id)) {
      return null;
    }
    const current = this.logMap.get(id);
    if (current?.type === Action.Move) {
      if (this.currentId.get(current.from) === current.id) {
        return current.from;
      }
      return null;
    }
    return id;
  }

  move(
    from: { parents: number[]; offset: number },
    to: { parents: number[]; offset: number | null }
  ): Move {
    const target = this.getByPath(to);

    const action: Move = {
      type: Action.Move,
      from: this.getByPath(from).id as Clock,
      targetParent: target.parentId,
      targetLeftId: target.id,
      id: this.clock.tick(),
    };
    this.applyEvent(action);
    return action;
  }

  private getByPath(path: { parents: number[]; offset: number | null }): {
    parentId: Clock | null;
    id: Clock | null;
  } {
    let parentId: Clock | null = null;
    for (const offset of path.parents) {
      const brother: Clock[] = this.children.get(parentId) as Clock[];
      parentId = this.getByOffset(brother, offset);
    }
    if (path.offset === null) {
      return { parentId, id: null };
    }
    return {
      parentId,
      id: this.getByOffset(this.children.get(parentId) ?? [], path.offset),
    };
  }

  public applyEvent(event: Event): void {
    this.clock = this.clock.merge(event.id);
    this.logs.splice(searchIndex(this.logs, event), 0, event);
  }

  private getChildrenNodes(parentId: null | Clock): any {
    return this.children.get(parentId)?.map((id) => {
      return {
        content: `${this.value.get(id)} - ${id.toString()}`,
        children: this.getChildrenNodes(id),
      };
    });
  }

  public buildTree(): Tree {
    return {
      content: this.clock.actorId,
      children: this.getChildrenNodes(null),
    };
  }
}
