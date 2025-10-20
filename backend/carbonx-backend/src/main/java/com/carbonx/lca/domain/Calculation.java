package com.carbonx.lca.domain;

import java.time.Instant;

import jakarta.persistence.*;

@Entity
@Table(name = "calculations")
public class Calculation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Lob
    @Column(name = "input_json", columnDefinition = "TEXT")
    private String inputJson;

    @Lob
    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getInputJson() { return inputJson; }
    public String getResultJson() { return resultJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setId(Long id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setInputJson(String inputJson) { this.inputJson = inputJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}


