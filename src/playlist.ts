export class Song {
  constructor(public title: string, public artist: string, public duration?: string, public isFavorite: boolean = false, public videoId?: string) {}
}

export class Node {
  constructor(public song: Song, public prev: Node | null = null, public next: Node | null = null) {}
}

export class DoublyLinkedList {
  private head: Node | null = null;
  private tail: Node | null = null;
  private current: Node | null = null;
  private size: number = 0;

  getSize(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  addAtBeginning(song: Song): void {
    const newNode = new Node(song);
    if (this.isEmpty()) {
      this.head = this.tail = this.current = newNode;
    } else {
      newNode.next = this.head;
      this.head!.prev = newNode;
      this.head = newNode;
    }
    this.size++;
  }

  addAtEnd(song: Song): void {
    const newNode = new Node(song);
    if (this.isEmpty()) {
      this.head = this.tail = this.current = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  addAtPosition(song: Song, position: number): boolean {
    if (position < 0 || position > this.size) return false;
    if (position === 0) {
      this.addAtBeginning(song);
      return true;
    }
    if (position === this.size) {
      this.addAtEnd(song);
      return true;
    }
    const newNode = new Node(song);
    let current = this.head;
    for (let i = 0; i < position - 1; i++) {
      current = current!.next;
    }
    newNode.next = current!.next;
    newNode.prev = current;
    current!.next!.prev = newNode;
    current!.next = newNode;
    this.size++;
    return true;
  }

  remove(song: Song): boolean {
    if (this.isEmpty()) return false;
    let current = this.head;
    while (current) {
      if (current.song.title === song.title && current.song.artist === song.artist) {
        if (current === this.head) {
          this.head = current.next;
          if (this.head) this.head.prev = null;
          else this.tail = null;
        } else if (current === this.tail) {
          this.tail = current.prev;
          if (this.tail) this.tail.next = null;
          else this.head = null;
        } else {
          current.prev!.next = current.next;
          current.next!.prev = current.prev;
        }
        if (current === this.current) {
          this.current = current.next || current.prev;
        }
        this.size--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  next(): Song | null {
    if (!this.current) return null;
    if (this.current.next) {
      this.current = this.current.next;
    } else {
      this.current = this.head; // Loop to beginning
    }
    return this.current ? this.current.song : null;
  }

  previous(): Song | null {
    if (!this.current) return null;
    if (this.current.prev) {
      this.current = this.current.prev;
    } else {
      this.current = this.tail; // Loop to end
    }
    return this.current ? this.current.song : null;
  }

  getCurrent(): Song | null {
    return this.current ? this.current.song : null;
  }

  setCurrent(song: Song): boolean {
    let current = this.head;
    while (current) {
      if (current.song.title === song.title && current.song.artist === song.artist) {
        this.current = current;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  getAllSongs(): Song[] {
    const songs: Song[] = [];
    let current = this.head;
    while (current) {
      songs.push(current.song);
      current = current.next;
    }
    return songs;
  }
}