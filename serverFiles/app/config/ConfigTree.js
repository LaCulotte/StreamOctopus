class ConfigTree {
    constructor(schema) {
        this.schema = schema;

        this.process();
    }

    process() {
        if (!this.schema) {
            // this.root = document.createElement("textarea");
            // this.root.style = "width: 100%; height: 200px;";
            this.root = new UndefinedLeaf();
        } else {
            this.root = new ObjectNode(this.schema);
        }
    }

    fill(config) {
        // if (!this.schema) {
        //     this.root.value = JSON.stringify(config);
        // } else {
        this.root.fill(config);
        // }
    }

    render() {
        return this.root.render();
    }

    getConfig() {
        if(!this.schema) {
            return JSON.parse(this.root.value);
        } else {
            return this.root.getValue();
        }
    }
};

function buildChild(schema) {
    switch(schema.type) {
        case "object": 
            return new ObjectNode(schema.children);
        case "list": 
            return new ListNode(schema.children);

        case "number":
            return new NumberLeaf(schema);
        case "string":
            return new StringLeaf(schema);
        case "bool":
        case "boolean":
            return new BoolLeaf(schema);

        default:
            return undefined;
    }
}

class ObjectNode {    
    constructor(schema) {
        this.wellDefined = false;
        this.wellFilled = false;
        
        this.children = {};
        this.childrenElems = {};
        this.process(schema);
    }

    process(schema) {
        try {
            this.children = {};
            this.childrenElems = {}

            this.rootElem = document.createElement("dl");

            for(let childName in schema) {
                let childSchema = schema[childName];
                console.log(childName);

                let childNode = buildChild(childSchema);

                if(childNode && childNode.wellDefined) {
                    this.children[childName] = childNode;
                    this.appendChild(childName, childNode.render());
                } else {
                    let errSpan = document.createElement("span");
                    errSpan.style = "color: red;"
                    errSpan.innerHTML = "Ill defined element";

                    this.appendChild(childName, errSpan);
                }
            }

            this.wellDefined = true;
        } catch(e) {
            console.log(e);
            // console.error(`Error on object process : ${e.message}`)
        }
    }

    appendChild(name, elem) {
        let childDt = document.createElement("dt");
        childDt.innerHTML = name;
        let childDd = document.createElement("dd");
        childDd.appendChild(elem);

        this.rootElem.append(childDt);
        this.rootElem.append(childDd);

        this.childrenElems[name] = {
            "dt": childDt,
            "dd": childDd
        }
    }

    fill(config) {
        try {
            for(let childName in config) {
                let child = this.children[childName];
                console.log(childName);

                if(child) {
                    child.fill(config[childName]);
                } else {
                    let childNode = new UndefinedLeaf();
                    childNode.fill(config[childName]);

                    this.children[childName] = childNode;
                    this.appendChild(childName, childNode.render());

                    let rmButton = document.createElement("input");
                    rmButton.type = "button";
                    rmButton.value = "-"
                    rmButton.onclick = () => {
                        this.removeChild(childName);
                    }
                    
                    let childDt = this.childrenElems[childName].dt;
                    childDt.appendChild(rmButton)
                }
            }

            this.wellFilled = true;
        } catch (e) {            
            console.error(`Error on object fill : ${e.message}`)
        }
    }

    removeChild(childName) {
        delete this.children[childName];

        let elem = this.childrenElems[childName]
        if(elem) {
            this.rootElem.removeChild(elem.dt);
            this.rootElem.removeChild(elem.dd);
        }

        delete this.childrenElems[childName];
    }

    render() {
        return this.rootElem;
    }

    getValue() {
        let value = {};

        for (let childName in this.children) {
            value[childName] = this.children[childName].getValue();
        }

        return value;
    }
};

class ListNode {    
    constructor(schema) {
        this.wellDefined = false;
        this.wellFilled = false;
        
        this.children = {};
        this.childrenElems = {};

        this.childrenSchema = undefined;
        this.process(schema);
    }

    process(schema) {
        try {
            this.rootElem = document.createElement("div");
            
            let addButton = document.createElement("input");
            addButton.type = "button";
            addButton.value = "+";
            addButton.onclick = () => {
                this.newElement();
            }

            this.listElem = document.createElement("dl");

            this.rootElem.appendChild(addButton);
            this.rootElem.appendChild(this.listElem);

            this.childrenSchema = schema;

            this.wellDefined = true;
        } catch(e) {
            console.log(e);
            // console.error(`Error on object process : ${e.message}`)
        }
    }

    fill(config) {
        try {
            this.children = [];
            this.childrenElems = [];

            this.listElem.innerHTML = "";

            for(let i in config) {
                let childConfig = config[i];
                this.newElement(childConfig);
            }

            this.wellFilled = true;
        } catch (e) {            
            console.error(`Error on object fill : ${e.message}`)
        }
    }
    
    newElement(config) {
        let childNode = buildChild(this.childrenSchema);

        if(!childNode)
            return;
        
        if(config)
            childNode.fill(config);

        let i = this.children.length

        this.children.push(childNode);
        this.appendChild(i, childNode.render());
    }

    appendChild(i, elem) {
        let childDt = document.createElement("dt");
        childDt.innerHTML = i;
        let childDd = document.createElement("dd");
        childDd.appendChild(elem);

        let rmButton = document.createElement("input");
        rmButton.type = "button";
        rmButton.value = "-"
        rmButton.onclick = () => {
            this.removeChild(i);
        }
        childDt.appendChild(rmButton);

        this.listElem.append(childDt);
        this.listElem.append(childDd);

        this.childrenElems.push({
            "dt": childDt,
            "dd": childDd,
            "rmButton": rmButton
        });
    }

    removeChild(i) {
        console.log(i);
        this.children.splice(i, 1);

        let elem = this.childrenElems[i]
        if(elem) {
            this.listElem.removeChild(elem.dt);
            this.listElem.removeChild(elem.dd);
        }
        this.childrenElems.splice(i, 1);

        for(let k = i; k < this.childrenElems.length; k++) {
            this.childrenElems[k].dt.innerHTML = k;
            this.childrenElems[k].dt.appendChild(this.childrenElems[k].rmButton);
            this.childrenElems[k].rmButton.onclick = () => {
                this.removeChild(k);
            }
        }
    }

    render() {
        return this.rootElem;
    }

    getValue() {
        let value = [];

        for (let child of this.children) {
            value.push(child.getValue());
        }

        return value;
    }
};

class Leaf {
    constructor(schema) {
        this.defaultValue = undefined;
        if(schema.default && this.checkValue(schema.default))
            this.defaultValue = schema.default;
    }

    checkValue(value) {
        return false;
    }
};

class NumberLeaf extends Leaf {
    constructor(schema) {
        super(schema);

        if(this.defaultValue === undefined)
            this.defaultValue = 0;

        this.process(schema)
    }

    process(schema) {
        this.rootElem = document.createElement("input");
        this.rootElem.type = "number";
        this.rootElem.value = this.defaultValue;

        if(schema.step)
            this.rootElem.step = schema.step;

        this.wellDefined = true;
    }

    fill(config) {
        if(this.checkValue(config)) {
            this.rootElem.value = config;
            this.wellFilled = true;
        }
    }

    getValue() {
        return Number(this.rootElem.value);
    }

    render() {
        return this.rootElem;
    }

    checkValue(value) {
        return typeof(value) == "number";
    }
};

class StringLeaf extends Leaf {
    constructor(schema) {
        super(schema);

        if(this.defaultValue === undefined)
            this.defaultValue = "";

        this.process(schema)
    }

    process(schema) {
        this.rootElem = document.createElement("input");
        this.rootElem.type = "text";
        this.rootElem.value = this.defaultValue;

        this.wellDefined = true;
    }

    fill(config) {
        if(this.checkValue(config)) {
            this.rootElem.value = config;
            this.wellFilled = true;
        }
    }

    getValue() {
        return this.rootElem.value;
    }

    render() {
        return this.rootElem;
    }

    checkValue(value) {
        return typeof(value) == "string";
    }
};

class BoolLeaf extends Leaf {
    constructor(schema) {
        super(schema);

        if(this.defaultValue === undefined)
            this.defaultValue = false;

        this.process(schema)
    }

    process(schema) {
        this.rootElem = document.createElement("input");
        this.rootElem.type = "checkbox";
        this.rootElem.checked = this.defaultValue;

        this.wellDefined = true;
    }

    fill(config) {
        if(this.checkValue(config)) {
            this.rootElem.checked = config;
            this.wellFilled = true;
        }
    }

    getValue() {
        return this.rootElem.checked;
    }

    render() {
        return this.rootElem;
    }

    checkValue(value) {
        return typeof(value) == "boolean";
    }
};

class UndefinedLeaf {
    constructor() {
        this.process();
    }

    process() {
        this.rootElem = document.createElement("textarea");
        this.wellDefined = true;
    }

    fill(config) {
        this.rootElem.value = JSON.stringify(config);
        this.wellFilled = true;
    }

    getValue() {
        return JSON.parse(this.rootElem.value);
    }

    render() {
        return this.rootElem;
    }

    checkValue(value) {
        return typeof(value) == "boolean";
    }
};