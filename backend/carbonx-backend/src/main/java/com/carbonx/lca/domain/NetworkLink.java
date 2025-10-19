package com.carbonx.lca.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "network_links")
public class NetworkLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "from_node", nullable = false)
    private String fromNode;

    @Column(name = "to_node", nullable = false)
    private String toNode;

    @Column(nullable = false)
    private double weight;

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getFromNode() { return fromNode; }
    public String getToNode() { return toNode; }
    public double getWeight() { return weight; }
    public void setId(Long id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setFromNode(String fromNode) { this.fromNode = fromNode; }
    public void setToNode(String toNode) { this.toNode = toNode; }
    public void setWeight(double weight) { this.weight = weight; }
}


