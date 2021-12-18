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
    parentsFrom: number[],
    offsetFrom: number,
    parentsTo: number[],
    offsetTo: number | null
  ): Move {
    const target = this.getByPath({
      parents: parentsTo,
      offset: offsetTo,
    });

    const action: Move = {
      type: Action.Move,
      from: this.getByPath({
        parents: parentsFrom,
        offset: offsetFrom,
      }).id as Clock,
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
    const res = buildLogs(this.logs);
    this.value = res.value;
    this.currentId = res.currentId;
    this.value = res.value;
    this.logMap = res.logMap;
    this.children = res.children;
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

function getRealId(currentId: Map<Clock, Clock>, id: Clock) {
  return currentId.get(id);
}

function buildLogs(logs: Event[]) {
  const children: Map<Clock | null, Clock[]> = new Map();
  const value: Map<Clock | null, string> = new Map();
  const currentId: Map<Clock, Clock> = new Map();
  const parent: Map<Clock | null, Clock | null> = new Map();
  const logMap: Map<Clock, Event> = new Map();
  logs.forEach((e) => {
    logMap.set(e.id, e);
  });
  for (const log of logs) {
    switch (log.type) {
      case Action.AddLeaf: {
        value.set(log.id, log.value);
        const c = children.get(log.parentId) ?? [];
        const offset = c.findIndex((o) => o === log.leftId) + 1;
        c.splice(offset, 0, log.id);
        children.set(log.parentId, c);
        parent.set(log.id, log.parentId);
        break;
      }
      case Action.Move: {
        const oldParent = parent.get(log.from);
        const newParent = log.targetParent;
        const changeParent = oldParent === newParent;
        if (changeParent) {
          const parentLog: Clock[] = [];
          let p = currentId.get(log.targetParent!) ?? log.targetParent!;
          while (p) {
            parentLog.push(p);
            p = currentId.get(p) ?? p;
          }
          if (parentLog.every((o) => o !== log.from)) {
            parent.set(log.id, log.targetParent);
            currentId.set(log.from, log.id);
            const c = children.get(log.targetParent) ?? [];
            const offset = c.findIndex((o) => o === log.targetLeftId) + 1;
            c.splice(offset, 0, log.id);
            children.set(log.targetParent, c);
          } else {
            //ignore
          }
        } else {
          parent.set(log.id, log.targetParent);
          currentId.set(log.from, log.id);
          const c = children.get(log.targetParent) ?? [];
          const offset = c.findIndex((o) => o === log.targetLeftId) + 1;
          c.splice(offset, 0, log.id);
          children.set(log.targetParent, c);
        }
        break;
      }
    }
  }

  return {
    children,
    value,
    currentId,
    logMap,
    parent,
  };
}
