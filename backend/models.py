from sqlalchemy import Column, Integer, String, ForeignKey, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # client or freelancer


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    budget = Column(Integer)
    status = Column(String, default="Open")
    client_id = Column(Integer, ForeignKey("users.id"))


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    proposal = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    freelancer_id = Column(Integer, ForeignKey("users.id"))
