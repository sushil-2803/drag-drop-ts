//Dreag & Drop Interfaces
interface Draggable{
    dragStartHandler(event:DragEvent):void
    dragEndHandler(event:DragEvent):void
}
interface DragTarget{
    dragOverHandler(event:DragEvent):void
    dropHandler(event:DragEvent):void
    dragLeaveHandler(event:DragEvent):void
}
//Project Type
enum ProjectStatus {
    Active,
    Finished,
}
class Project {
    constructor(
        public id: string,
        public title: string,
        public description: string,
        public people: number,
        public status: ProjectStatus
    ) { }
}
// Project State management
type Listener <T>= (items: T[]) => void;
class State<T>{
    protected listeners: Listener<T>[] = [];
    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}
class ProjectState extends State<Project> {
    private projects: any[] = [];
    private static instance: ProjectState; // by making this property static make sure that there is only one instace of this
    // we are creating a singleton Class
    private constructor() {
        super()
        // here by making constructor private the class cannot pe initialized outside the class definition
    }
    // to create a instance of this class we create method which checks for the instance of the class if exsists returns that or create a new and returns that
    // making the method static there cannont be more than one instacne of this method
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    
    addproject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(Math.random().toString(), title, description, numOfPeople, ProjectStatus.Active)
        this.projects.push(newProject);
        this.updateListeners()
    }
    moveProject(projectId:string,newStatus:ProjectStatus){
        const project=this.projects.find(prj=>prj.id===projectId)
        if(project && project.status !== newStatus){
            project.status=newStatus
            this.updateListeners()
        }
    }
    private updateListeners()
    {
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}
const projectState = ProjectState.getInstance(); //static method are called using the class name
//Validation
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

function validate(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    if (
        validatableInput.minLength != null &&
        typeof validatableInput.value === "string"
    ) {
        isValid =
            isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (
        validatableInput.maxLength != null &&
        typeof validatableInput.value === "string"
    ) {
        isValid =
            isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (
        validatableInput.min != null &&
        typeof validatableInput.value === "number"
    ) {
        isValid = isValid && validatableInput.value >= validatableInput.min;
    }
    if (
        validatableInput.max != null &&
        typeof validatableInput.value === "number"
    ) {
        isValid = isValid && validatableInput.value <= validatableInput.max;
    }
    return isValid;
}
//autobind decorator
function autobind(
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this); // this refers to the  event here but we use bind method to change ths behaviour
            return boundFn;
        },
    };
    return adjDescriptor;
}
//
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;
    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string
    ) {
        this.templateElement = document.getElementById(
            templateId
        )! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;
        const importedNode = document.importNode(
            this.templateElement.content,
            true
        );
        this.element = importedNode.firstElementChild as U;
        if (newElementId) {
            this.element.id = newElementId
        }
        this.attach(insertAtStart)
    }
    private attach(insertAtBeginning: boolean) {
        this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
    }
    abstract configure(): void;
    abstract renderContent(): void;
}
//ProjectItem Class
class ProjectItem extends Component<HTMLUListElement,HTMLLIElement> implements Draggable{
    private project:Project
    get resources(){
        if(this.project.people===1){
            return '1 resource assgined'
        }else{
            return `${this.project.people} resources assgined`
        }
    }
    constructor(hostId:string,project:Project){
        super('single-project',hostId,false,project.id)
        this.project=project
        this.configure()
        this.renderContent()
    }
    @autobind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain',this.project.id)
        event.dataTransfer!.effectAllowed='move'
    }
    @autobind
    dragEndHandler(event: DragEvent): void {
        // console.log('DragEnd')
    }
    configure(): void {
        this.element.addEventListener('dragstart',this.dragStartHandler)
        this.element.addEventListener('dragend',this.dragEndHandler)
    }
    renderContent(): void {
        this.element.querySelector('h2')!.textContent=this.project.title;
        this.element.querySelector('h3')!.textContent=this.resources;
        this.element.querySelector('p')!.textContent=this.project.description;
    }

}
// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedPorjects: Project[];
    constructor(private type: "active" | "finished") {
        super("project-list", 'app', false, `${type}-projects`)
        this.assignedPorjects = [];
        this.configure()
        this.renderContent();
    }
    @autobind
    dragOverHandler(event: DragEvent): void {
        if(event.dataTransfer && event.dataTransfer.types[0]==='text/plain'){
            event.preventDefault() //ading this to allow to drop in js as js doesnot allow drop by defualt
            const listEl=this.element.querySelector('ul')!
            listEl.classList.add('droppable')
        }
    }
    @autobind
    dropHandler(event: DragEvent): void {
        const projId=event.dataTransfer!.getData('text/plain')
        projectState.moveProject(projId,this.type==='active'?ProjectStatus.Active:ProjectStatus.Finished)
    }
    @autobind
    dragLeaveHandler(event: DragEvent): void {
        const listEl=this.element.querySelector('ul')!
        listEl.classList.remove('droppable')
    }
    configure(): void {
        this.element.addEventListener('dragover',this.dragOverHandler)
        this.element.addEventListener('dragleave',this.dragLeaveHandler)
        this.element.addEventListener('drop',this.dropHandler)
        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter((project) => {
                if (this.type === 'active') {
                    return project.status === ProjectStatus.Active
                }
                return project.status === ProjectStatus.Finished
            })
            this.assignedPorjects = relevantProjects;
            this.renderProjects();
        });
    }
    renderContent() {
        const listId = `${this.type}-project-list`;
        this.element.querySelector("ul")!.id = listId;
        this.element.querySelector("h2")!.textContent =
            this.type.toUpperCase() + " Projects";
    }
    private renderProjects() {
        const listEl = document.getElementById(
            `${this.type}-project-list`
        )! as HTMLUListElement;
        listEl.innerHTML = ''
        for (const prjItem of this.assignedPorjects) {
            const listItem = document.createElement("li");
            new ProjectItem(this.element.querySelector('ul')!.id,prjItem)
        }
    }

}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement,HTMLFormElement> {
    titleInputEmlemnt: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;
    constructor() {
        super('project-input','app',true,'user-input')
        this.titleInputEmlemnt = this.element.querySelector(
            "#title"
        ) as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector(
            "#description"
        ) as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector(
            "#people"
        ) as HTMLInputElement;
        this.configure();
    }
    configure() {
        this.element.addEventListener("submit", this.submitHandler); //using bind we telling which this refer to class or the event
    }
    renderContent(){}
    private clearInputs() {
        this.titleInputEmlemnt.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }
    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputEmlemnt.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;
        const titleValidatable: Validatable = {
            value: enteredTitle,
        };
        if (
            !validate({ value: enteredTitle, required: true, minLength: 5 }) ||
            !validate({ value: enteredDescription, required: true, minLength: 5 }) ||
            !validate({ value: +enteredPeople, required: true, min: 1 })
        ) {
            alert("Invalid Input");
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }
    @autobind // using decorator in js to autobind this keyword to class instead of event bind method can also be used
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addproject(title, description, people);
            console.log(title, description, people);
            this.clearInputs();
        }
    }

}
const projInput = new ProjectInput();
const active = new ProjectList("active");
const finished = new ProjectList("finished");
