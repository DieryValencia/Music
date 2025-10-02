export class Song {
    constructor(title, artist, duration, isFavorite = false, videoId) {
        this.title = title;
        this.artist = artist;
        this.duration = duration;
        this.isFavorite = isFavorite;
        this.videoId = videoId;
    }
}
export class Node {
    constructor(song, prev = null, next = null) {
        this.song = song;
        this.prev = prev;
        this.next = next;
    }
}
export class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.current = null;
        this.size = 0;
    }
    getSize() {
        return this.size;
    }
    isEmpty() {
        return this.size === 0;
    }
    addAtBeginning(song) {
        const newNode = new Node(song);
        if (this.isEmpty()) {
            this.head = this.tail = this.current = newNode;
        }
        else {
            newNode.next = this.head;
            this.head.prev = newNode;
            this.head = newNode;
        }
        this.size++;
    }
    addAtEnd(song) {
        const newNode = new Node(song);
        if (this.isEmpty()) {
            this.head = this.tail = this.current = newNode;
        }
        else {
            newNode.prev = this.tail;
            this.tail.next = newNode;
            this.tail = newNode;
        }
        this.size++;
    }
    addAtPosition(song, position) {
        if (position < 0 || position > this.size)
            return false;
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
            current = current.next;
        }
        newNode.next = current.next;
        newNode.prev = current;
        current.next.prev = newNode;
        current.next = newNode;
        this.size++;
        return true;
    }
    remove(song) {
        if (this.isEmpty())
            return false;
        let current = this.head;
        while (current) {
            if (current.song.title === song.title && current.song.artist === song.artist) {
                if (current === this.head) {
                    this.head = current.next;
                    if (this.head)
                        this.head.prev = null;
                    else
                        this.tail = null;
                }
                else if (current === this.tail) {
                    this.tail = current.prev;
                    if (this.tail)
                        this.tail.next = null;
                    else
                        this.head = null;
                }
                else {
                    current.prev.next = current.next;
                    current.next.prev = current.prev;
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
    next() {
        if (!this.current)
            return null;
        if (this.current.next) {
            this.current = this.current.next;
        }
        else {
            this.current = this.head; // Loop to beginning
        }
        return this.current ? this.current.song : null;
    }
    previous() {
        if (!this.current)
            return null;
        if (this.current.prev) {
            this.current = this.current.prev;
        }
        else {
            this.current = this.tail; // Loop to end
        }
        return this.current ? this.current.song : null;
    }
    getCurrent() {
        return this.current ? this.current.song : null;
    }
    setCurrent(song) {
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
    getAllSongs() {
        const songs = [];
        let current = this.head;
        while (current) {
            songs.push(current.song);
            current = current.next;
        }
        return songs;
    }
}
