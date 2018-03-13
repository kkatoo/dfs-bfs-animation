const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 800;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

interface IMazeGenerator {
    generate(width: number, height: number): number[][];
}

abstract class Solver {
    abstract solve(maze: number[][]): Promise<void>;

    finished = false;

    async step(): Promise<void> {
        if (this.finished) {
            return;
        }
        return new Promise<void>((resolve, reject) => {
            this.next = () => {
                resolve();
                return false;
            }
        });
    }

    finish() {
        this.finished = true;
        this.next = () => true;
    }

    next = () => true;
}

class DFSSolver extends Solver {
    private dx = [0, 0, 1, -1];
    private dy = [1, -1, 0, 0];
    private maze: number[][] | null = null;

    private async dfs(x: number, y: number, d: number) {
        if (this.maze![y][x] === 3) {
            this.finish();
        }

        if (this.maze![y][x] !== 0 && this.maze![y][x] !== 2)
            return;

        this.maze![y][x] = 4;
        await this.step();

        for (let i = 0; i < 4; i++) {
            await this.dfs(x + this.dx[i], y + this.dy[i], d++);
        }
    }

    async solve(maze: number[][]): Promise<void> {
        this.maze = maze;
        let s: number[] | null = null;
        let g: number[] | null = null;
        for (let i = 0; i < maze.length; i++) {
            for (let j = 0; j < maze[i].length; j++) {
                if (maze[i][j] === 2)
                    s = [j, i];
                if (maze[i][j] === 3)
                    g = [j, i];
            }
        }

        if (!s || !g)
            throw new Error("Error");

        await this.dfs(s[0], s[1], 0);

        this.finish();
    }
}

class BFSSolver extends Solver {
    private dx = [0, 0, 1, -1];
    private dy = [1, -1, 0, 0];
    async solve(maze: number[][]): Promise<void> {
        let s: number[] | null = null;
        let g: number[] | null = null;
        for (let i = 0; i < maze.length; i++) {
            for (let j = 0; j < maze[i].length; j++) {
                if (maze[i][j] === 2)
                    s = [j, i];
                if (maze[i][j] === 3)
                    g = [j, i];
            }
        }

        if (!s || !g)
            throw new Error("Error");

        let queue = [];
        queue.push(s);
        maze[s[1]][s[0]] = 4;


        while (queue.length !== 0) {
            let p: number[] = <number[]>queue.shift();

            for (let i = 0; i < 4; i++) {
                let nx = p[0] + this.dx[i];
                let ny = p[1] + this.dy[i];


                if (maze[ny][nx] === 3)
                    this.finish();
                
                if (maze[ny][nx] !== 0)
                    continue;

                maze[ny][nx] = 4;
                queue.push([nx, ny]);
            }

            await this.step();
        }

        this.finish();
    }
}

class MazeGenerator implements IMazeGenerator {
    private dx = [0, 0, 1, -1];
    private dy = [1, -1, 0, 0];

    generate(width: number, height: number): number[][] {
        const maze: number[][] = [];

        for (let i = 0; i < height; i++) {
            maze[i] = [];
            for (let j = 0; j < width; j++) {
                if (i === 0 || i === height - 1 || j === 0 || j === width - 1)
                    maze[i][j] = 1;
                else
                    maze[i][j] = 0;
            }
        }

        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (i % 2 === 0 && j % 2 == 0 && 0 < i && 0 < j && i < height - 1 && j < width - 1) {
                    maze[i][j] = 1;

                    while (true) {
                        const rnd = Math.floor(Math.random() * 4);
                        if (rnd === 1 && i !== 2)
                            continue;
                        if (maze[i + this.dy[rnd]][j + this.dx[rnd]] === 0) {
                            maze[i + this.dy[rnd]][j + this.dx[rnd]] = 1;
                            break;
                        }
                    }
                }
            }
        }

        maze[1][1] = 2;
        maze[height - 2][width - 2] = 3;

        return maze;
    }
}


class Manager {
    maze: number[][];
    intervalId: number | null;

    constructor(private generator: MazeGenerator, private solver: Solver) {
        this.maze = generator.generate(51, 51);
        Renderer.render(this.maze);
        this.intervalId = null;
    }

    animate() {
        if (this.intervalId)
            stop();

        solver.solve(this.maze);

        this.intervalId = setInterval(() => {
            const finished = solver.next();
            if (finished)
                this.stop();
            else
                Renderer.render(this.maze);
        }, 10);
    }

    stop() {
        console.log("animation finished");
        if (!this.intervalId)
            return;
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
}

class Renderer {
    static cellSize = 10;
    private static intervalID: number;

    static render(maze: number[][]) {
        for (let i = 0; i < maze.length; i++) {
            for (let j = 0; j < maze[i].length; j++) {
                if (maze[i][j] === 0)
                    ctx!.fillStyle = `rgb(255, 255, 255)`;
                if (maze[i][j] === 1)
                    ctx!.fillStyle = "rgb(0, 0, 0)";
                if (maze[i][j] === 2)
                    ctx!.fillStyle = "rgb(0, 255, 0)";
                if (maze[i][j] === 3)
                    ctx!.fillStyle = "rgb(255, 0, 0)";
                if (maze[i][j] === 4)
                    ctx!.fillStyle = "rgb(128, 128, 128)"
                ctx!.fillRect(this.cellSize * j, this.cellSize * i, this.cellSize, this.cellSize);
            }
        }
    }
}

const generator = new MazeGenerator();
const solver = new BFSSolver();
const manager = new Manager(generator, solver);
manager.animate();