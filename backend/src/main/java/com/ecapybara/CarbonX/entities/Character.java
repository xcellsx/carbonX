package com.ecapybara.CarbonX.entities;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import com.arangodb.springframework.annotation.Relations;

import java.util.Collection;

import org.springframework.data.annotation.Id;

@Document("characters")
@PersistentIndex(fields = {"surname"})
public class Character {

    @Id // db document field: _key
    private String id;

    @ArangoId // db document field: _id
    private String arangoId;

    private String name;
    private String surname;
    private boolean alive;
    private Integer age;
    @Relations(edges = ChildOf.class, lazy = true)
    private Collection<Character> children;

    public Character() {
        super();
    }

    public Character(final String name, final String surname, final boolean alive) {
        super();
        this.name = name;
        this.surname = surname;
        this.alive = alive;
    }

    public Character(final String name, final String surname, final boolean alive, final Integer age) {
        super();
        this.name = name;
        this.surname = surname;
        this.alive = alive;
        this.age = age;
    }

    @Override
    public String toString() {
        return "Character [id=" + id + ", name=" + name + ", surname=" + surname + ", alive=" + alive + ", age=" + age + "]";
    }

    // getters & setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getArangoId() {
        return arangoId;
    }

    public void setArangoId(String arangoId) {
        this.arangoId = arangoId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public boolean isAlive() {
        return alive;
    }

    public void setAlive(boolean alive) {
        this.alive = alive;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public Collection<Character> getChildren() {
        return children;
    }

}
