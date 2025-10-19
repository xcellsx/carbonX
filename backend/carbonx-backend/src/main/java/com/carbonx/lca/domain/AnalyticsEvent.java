package com.carbonx.lca.domain;

import java.time.Instant;

import jakarta.persistence.*;

@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(nullable = false)
    private String type;

    @Lob
    @Column(name = "metadata_json")
    private String metadataJson;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public Project getProject() { return project; }
    public String getType() { return type; }
    public String getMetadataJson() { return metadataJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setId(Long id) { this.id = id; }
    public void setProject(Project project) { this.project = project; }
    public void setType(String type) { this.type = type; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}


