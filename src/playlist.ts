/**
 * Representa una canción en la playlist.
 */
export class Song {
  constructor(public title: string, public artist: string, public duration?: string, public isFavorite: boolean = false, public videoId?: string) {}
}

/**
 * Nodo para la lista doblemente enlazada.
 */
export class Node {
  constructor(public song: Song, public prev: Node | null = null, public next: Node | null = null) {}
}

/**
 * Lista doblemente enlazada para gestionar la playlist de canciones.
 * Permite navegación bidireccional y operaciones eficientes.
 */
export class DoublyLinkedList {
  private head: Node | null = null;
  private tail: Node | null = null;
  private current: Node | null = null;
  private size: number = 0;

  /** Devuelve el tamaño de la lista. */
  getSize(): number {
    return this.size;
  }

  /** Verifica si la lista está vacía. */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /** Agrega una canción al inicio de la lista. */
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

  /** Agrega una canción al final de la lista. */
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

  /** Agrega una canción en una posición específica. */
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

  /** Remueve una canción de la lista. */
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

  /** Avanza a la siguiente canción. */
  next(): Song | null {
    if (!this.current) return null;
    if (this.current.next) {
      this.current = this.current.next;
    } else {
      this.current = this.head; // Loop to beginning
    }
    return this.current ? this.current.song : null;
  }

  /** Retrocede a la canción anterior. */
  previous(): Song | null {
    if (!this.current) return null;
    if (this.current.prev) {
      this.current = this.current.prev;
    } else {
      this.current = this.tail; // Loop to end
    }
    return this.current ? this.current.song : null;
  }

  /** Obtiene la canción actual. */
  getCurrent(): Song | null {
    return this.current ? this.current.song : null;
  }

  /** Establece la canción actual. */
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

  /** Devuelve todas las canciones en un array. */
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